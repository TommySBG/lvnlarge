import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** CSV download of email sign-ups (admins only). ?consent=1 = only people who agreed to news. */
export async function GET(request: Request) {
  await connection();
  await requireAdmin();
  const onlyConsented = new URL(request.url).searchParams.get("consent") === "1";

  const supabase = await createClient();
  const rows: Record<string, unknown>[] = [];
  // Read in pages so large lists still download in full.
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("subscribers")
      .select("email, marketing_consent, marketing_consent_at, first_seen_at, last_seen_at, entry_count")
      .order("first_seen_at")
      .range(from, from + 999);
    if (onlyConsented) query = query.eq("marketing_consent", true);
    const { data, error } = await query;
    if (error) return new Response("Could not load sign-ups.", { status: 500 });
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const header = ["email", "agreed_to_news", "agreed_at", "first_seen", "last_seen", "visits"];
  const lines = rows.map((row) =>
    [row.email, row.marketing_consent ? "yes" : "no", row.marketing_consent_at ?? "", row.first_seen_at, row.last_seen_at, row.entry_count].map(csvCell).join(","),
  );
  const date = new Date().toISOString().slice(0, 10);

  return new Response([header.join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lvnlarge-${onlyConsented ? "news-list" : "sign-ups"}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Quote for CSV and stop spreadsheet apps treating a value as a formula. */
function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
