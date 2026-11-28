"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";
import { safeNextPath } from "@/lib/shop/entry";
import { enterStore, type EnterState } from "./actions";

const initial: EnterState = { ok: false, message: null };

export function EnterFormWithNext() {
  return <EnterForm next={safeNextPath(useSearchParams().get("next"))} />;
}

export function EnterForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(enterStore, initial);

  // After "Thank you for subscribing." step into the store automatically.
  useEffect(() => {
    if (!state.ok) return;
    const timer = window.setTimeout(() => router.replace(next), 1800);
    return () => window.clearTimeout(timer);
  }, [state.ok, next, router]);

  if (state.ok) {
    return (
      <div className="mt-7 flex animate-rise flex-col items-center gap-5" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-base text-white">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[#9aa66a]" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {state.message}
        </p>
        <Link
          href={next}
          replace
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold uppercase tracking-[0.25em] text-black transition-transform active:scale-[0.98]"
        >
          Enter the store
        </Link>
      </div>
    );
  }

  return (
    // A real Server Action form: works even before the page's JavaScript has
    // loaded, and never puts the email in the web address.
    <form action={action} className="mt-7 flex flex-col gap-3 text-left" noValidate>
      <label htmlFor="enter-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <input
          id="enter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="you@example.com"
          defaultValue={state.email ?? ""}
          aria-invalid={state.message ? true : undefined}
          aria-describedby={state.message ? "enter-error" : undefined}
          className="h-13 w-full min-w-0 rounded-full border sm:flex-1 border-white/20 bg-white/10 px-5 text-base text-white placeholder:text-white/45 focus:border-white/60 focus:bg-white/15 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-13 shrink-0 rounded-full bg-white px-6 text-sm font-semibold uppercase tracking-[0.2em] text-black transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "One moment…" : "Subscribe"}
        </button>
      </div>

      {/* Hidden from people; catches bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <label className="mt-1 flex cursor-pointer items-start gap-3 px-1 text-sm text-white/75">
        <input name="marketing" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#6b7744]" />
        <span>Email me about new drops and offers (optional)</span>
      </label>

      {state.message && (
        <p id="enter-error" role="alert" className="px-1 text-sm text-[#f0a397]">
          {state.message}
        </p>
      )}
      <p className="px-1 text-xs text-white/45">We only use your email for LVN’LARGE. No password needed.</p>
    </form>
  );
}
