"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { ENTRY_COOKIE, ENTRY_COOKIE_MAX_AGE } from "@/lib/shop/entry";

export type EnterState = { ok: boolean; message: string | null; email?: string };

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "That email is too long.")
  .pipe(z.email("Please enter a valid email address."));

/**
 * Email gate. Entering an email lets the visitor into the store; it is NOT
 * marketing consent — that is only recorded when the optional box is ticked.
 * Subscribers are written with the server key because shoppers have no
 * access to the subscribers table at all.
 */
export async function enterStore(_prev: EnterState, formData: FormData): Promise<EnterState> {
  // Hidden field real people never fill in; bots usually do.
  if (String(formData.get("company") ?? "") !== "") return { ok: false, message: "Something went wrong. Please try again." };

  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  const typed = String(formData.get("email") ?? "").slice(0, 254);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please enter a valid email address.", email: typed };
  const email = parsed.data;
  const wantsNews = formData.get("marketing") === "on";

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const saved = await saveSubscriber(supabase, email, wantsNews, now);
  if (!saved) return { ok: false, message: "We couldn't save your email just now. Please try again.", email: typed };

  (await cookies()).set(ENTRY_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ENTRY_COOKIE_MAX_AGE,
  });

  return { ok: true, message: "Thank you for subscribing." };
}

async function saveSubscriber(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  wantsNews: boolean,
  now: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: existing, error: readError } = await supabase
      .from("subscribers")
      .select("id, entry_count, marketing_consent")
      .eq("email", email)
      .maybeSingle();
    if (readError) return false;

    if (existing) {
      // Same email again: count the visit, never create a duplicate.
      // Unticking the box here does not withdraw earlier consent.
      const update: Record<string, unknown> = { entry_count: existing.entry_count + 1, last_seen_at: now };
      if (wantsNews && !existing.marketing_consent) {
        update.marketing_consent = true;
        update.marketing_consent_at = now;
        update.marketing_withdrawn_at = null;
      }
      const { error } = await supabase.from("subscribers").update(update).eq("id", existing.id);
      return !error;
    }

    const { error } = await supabase.from("subscribers").insert({
      email,
      marketing_consent: wantsNews,
      marketing_consent_at: wantsNews ? now : null,
    });
    if (!error) return true;
    // Someone else saved the same email a moment ago — loop and update instead.
    if (error.code !== "23505") return false;
  }
  return false;
}
