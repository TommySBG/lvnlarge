import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Overview" };

export default function AdminHome() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl uppercase tracking-wide text-silver-strong">Overview</h1>
      <p className="mt-2 text-sm text-ink-muted">Live counts from the store database.</p>
      <Suspense fallback={<p className="mt-8 text-sm text-ink-muted">Loading…</p>}>
        <Counts />
      </Suspense>
    </div>
  );
}

async function Counts() {
  await requireAdmin();
  const supabase = await createClient();

  const count = async (table: string) => {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    return error ? null : (count ?? 0);
  };

  const [products, collections, subscribers, orders] = await Promise.all([
    count("products"),
    count("collections"),
    count("subscribers"),
    count("orders"),
  ]);

  const tiles = [
    { label: "Products", value: products },
    { label: "Collections", value: collections },
    { label: "Email sign-ups", value: subscribers },
    { label: "Orders", value: orders },
  ];

  return (
    <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border border-line bg-surface p-5">
          <dt className="text-xs uppercase tracking-[0.25em] text-ink-muted">{tile.label}</dt>
          <dd className="mt-3 font-display text-4xl text-silver-strong">
            {tile.value ?? <span className="text-base text-danger">Error</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
