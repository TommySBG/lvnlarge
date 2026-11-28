import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Sign-ups" };

const shownLimit = 300;

export default function SignUpsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Sign-ups" description="Everyone who entered their email to get into the store. Only people who ticked the box agreed to news and offers." />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading sign-ups…</p>}>
        <SignUps />
      </Suspense>
    </div>
  );
}

const lagos = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" });

async function SignUps() {
  await requireAdmin();
  const supabase = await createClient();
  const [total, consented, list] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("marketing_consent", true),
    supabase
      .from("subscribers")
      .select("id, email, marketing_consent, entry_count, first_seen_at")
      .order("first_seen_at", { ascending: false })
      .limit(shownLimit),
  ]);
  const rows = list.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total sign-ups" value={total.count ?? 0} />
        <Stat label="Agreed to news" value={consented.count ?? 0} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a href="/admin/sign-ups/export" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-silver-strong hover:border-silver">
          Download all (CSV)
        </a>
        <a href="/admin/sign-ups/export?consent=1" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-silver-strong hover:border-silver">
          Download news list (CSV)
        </a>
      </div>
      <p className="-mt-3 text-xs text-ink-muted">Only email the “news list” with offers — the others didn’t agree to marketing.</p>

      {rows.length === 0 ? (
        <EmptyState>No sign-ups yet. They appear here as soon as someone enters their email on the site.</EmptyState>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-all text-base text-ink">{row.email}</span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                {row.marketing_consent && <Badge tone="good">News</Badge>}
                <span>{lagos.format(new Date(row.first_seen_at))}</span>
                <span>· {row.entry_count} {row.entry_count === 1 ? "visit" : "visits"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {(total.count ?? 0) > shownLimit && <p className="text-xs text-ink-muted">Showing the newest {shownLimit}. Download the CSV for everyone.</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-4xl text-silver-strong">{value.toLocaleString("en-NG")}</p>
    </div>
  );
}
