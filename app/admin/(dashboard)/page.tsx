import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { stockLevel } from "@/lib/admin/catalogue";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Overview" };

export default function AdminHome() {
  return (
    <>
      <PageHeader title="Overview" description="Live numbers from the store database." />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <Counts />
      </Suspense>
    </>
  );
}

async function Counts() {
  await requireAdmin();
  const supabase = await createClient();

  const count = async (table: string, filter?: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
    const query = base(table);
    const { count, error } = await (filter ? filter(query) : query);
    return error ? null : (count ?? 0);
  };
  function base(table: string) {
    return supabase.from(table).select("*", { count: "exact", head: true });
  }

  const [published, drafts, collections, subscribers, orders, variants] = await Promise.all([
    count("products", (q) => q.eq("status", "published")),
    count("products", (q) => q.eq("status", "draft")),
    count("collections", (q) => q.eq("is_published", true)),
    count("subscribers"),
    count("orders", (q) => q.not("order_number", "is", null)),
    supabase
      .from("product_variants")
      .select("stock_quantity, low_stock_threshold, products!inner(status)")
      .eq("is_active", true)
      .eq("products.status", "published"),
  ]);

  const levels = (variants.data ?? []).map((variant) => stockLevel(variant));
  const low = variants.error ? null : levels.filter((level) => level === "low").length;
  const out = variants.error ? null : levels.filter((level) => level === "out").length;

  const tiles = [
    { label: "Live products", value: published, href: "/admin/products?status=published" },
    { label: "Draft products", value: drafts, href: "/admin/products?status=draft" },
    { label: "Low stock", value: low, href: "/admin/stock?show=low", tone: low ? "warn" : undefined },
    { label: "Sold out", value: out, href: "/admin/stock?show=out", tone: out ? "bad" : undefined },
    { label: "Live collections", value: collections, href: "/admin/collections" },
    { label: "Email sign-ups", value: subscribers },
    { label: "Paid orders", value: orders },
  ];

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => {
          const body = (
            <>
              <dt className="text-xs uppercase tracking-[0.2em] text-ink-muted">{tile.label}</dt>
              <dd
                className={`mt-3 font-display text-4xl ${
                  tile.tone === "warn" ? "text-amber-500" : tile.tone === "bad" ? "text-danger" : "text-silver-strong"
                }`}
              >
                {tile.value ?? <span className="text-base text-danger">Error</span>}
              </dd>
            </>
          );
          return tile.href ? (
            <Link key={tile.label} href={tile.href} className="block rounded-xl border border-line bg-surface p-4 hover:border-silver">
              {body}
            </Link>
          ) : (
            <div key={tile.label} className="rounded-xl border border-line bg-surface p-4">
              {body}
            </div>
          );
        })}
      </dl>
      <p className="mt-4 text-xs text-ink-muted">Low stock and sold out count live (published) products only.</p>
    </>
  );
}
