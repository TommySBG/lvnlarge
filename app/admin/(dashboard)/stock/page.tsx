import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { stockLevel, type ProductStatus } from "@/lib/admin/catalogue";
import { Badge, EmptyState, PageHeader, inputClass } from "@/components/admin/ui";
import { StockStepper } from "./stock-stepper";

export const metadata = { title: "Stock" };

const filters = [
  { value: "all", label: "All" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Sold out" },
];

export default function StockPage({ searchParams }: PageProps<"/admin/stock">) {
  return (
    <>
      <PageHeader title="Stock" description="Tap − or + to change stock. Every change is recorded." />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading stock…</p>}>
        <StockList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

type Row = {
  id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  allow_preorder: boolean;
  sizes: { label: string; sort_order: number } | null;
  product_colours: { name: string; hex: string | null; sort_order: number } | null;
  products: { id: string; name: string; status: ProductStatus; allow_preorder: boolean } | null;
};

async function StockList({ searchParams }: { searchParams: PageProps<"/admin/stock">["searchParams"] }) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase().slice(0, 80) : "";
  const filter = filters.some((f) => f.value === params.show) ? String(params.show) : "all";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      "id, stock_quantity, low_stock_threshold, allow_preorder, sizes(label, sort_order), product_colours(name, hex, sort_order), products!inner(id, name, status, allow_preorder)",
    )
    .eq("is_active", true)
    .neq("products.status", "archived")
    .limit(2000);

  const rows = ((data ?? []) as unknown as Row[])
    .filter((row) => row.products && (!q || row.products.name.toLowerCase().includes(q)))
    .filter((row) => filter === "all" || stockLevel(row) === filter);

  // Group by product, sizes in order within each colour.
  const groups = new Map<string, { product: NonNullable<Row["products"]>; rows: Row[] }>();
  for (const row of rows) {
    const key = row.products!.id;
    if (!groups.has(key)) groups.set(key, { product: row.products!, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  const ordered = [...groups.values()].sort((a, b) => a.product.name.localeCompare(b.product.name));
  for (const group of ordered) {
    group.rows.sort(
      (a, b) =>
        (a.product_colours?.sort_order ?? 0) - (b.product_colours?.sort_order ?? 0) ||
        (a.sizes?.sort_order ?? 0) - (b.sizes?.sort_order ?? 0),
    );
  }

  return (
    <>
      <form className="mb-4 flex flex-col gap-3" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className={inputClass} />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              type="submit"
              name="show"
              value={f.value}
              aria-pressed={filter === f.value}
              className="min-h-11 shrink-0 rounded-full border border-line px-4 text-sm text-ink-muted aria-pressed:border-silver aria-pressed:bg-surface-2 aria-pressed:text-silver-strong"
            >
              {f.label}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="text-sm text-danger">Couldn’t load stock. Please reload.</p>}

      {ordered.length === 0 ? (
        <EmptyState>
          {filter === "low" ? "Nothing is low on stock." : filter === "out" ? "Nothing is sold out." : "No sizes to show yet. Add sizes on a product first."}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {ordered.map(({ product, rows: productRows }) => (
            <section key={product.id} className="rounded-xl border border-line bg-surface">
              <Link
                href={`/admin/products/${product.id}#stock`}
                className="flex min-h-14 items-center justify-between gap-3 border-b border-line px-4 py-3"
              >
                <span className="truncate text-base font-medium text-ink">{product.name}</span>
                {product.status === "draft" && <Badge>Draft</Badge>}
              </Link>
              <ul className="divide-y divide-line">
                {productRows.map((row) => {
                  const level = stockLevel(row);
                  const label = [row.sizes?.label, row.product_colours?.name].filter(Boolean).join(" · ");
                  return (
                    <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-base text-ink">
                          {row.product_colours?.hex && (
                            <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-line" style={{ background: row.product_colours.hex }} />
                          )}
                          {label || "Standard"}
                        </p>
                        <div className="mt-1 flex gap-1.5">
                          {level === "out" && <Badge tone="bad">Sold out</Badge>}
                          {level === "low" && <Badge tone="warn">Low</Badge>}
                          {level === "out" && (row.allow_preorder || product.allow_preorder) && <Badge>Preorder on</Badge>}
                        </div>
                      </div>
                      <StockStepper variantId={row.id} quantity={row.stock_quantity} label={`${product.name} ${label}`} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
