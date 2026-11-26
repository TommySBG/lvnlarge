import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import { catalogueImageUrl } from "@/lib/storage";
import { stockLevel, type ProductStatus } from "@/lib/admin/catalogue";
import { Badge, EmptyState, PageHeader, StatusBadge, buttonClass, inputClass } from "@/components/admin/ui";

export const metadata = { title: "Products" };

const filters: { value: string; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        action={
          <Link href="/admin/products/new" className={buttonClass.primary}>
            + New
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading products…</p>}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

type Row = {
  id: string;
  name: string;
  price_kobo: number;
  status: ProductStatus;
  is_coming_soon: boolean;
  product_types: { name: string } | null;
  product_images: { storage_path: string; sort_order: number }[];
  product_variants: { stock_quantity: number; low_stock_threshold: number; is_active: boolean }[];
};

async function ProductList({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const filter = typeof params.status === "string" && filters.some((f) => f.value === params.status) ? params.status : "active";

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "id, name, price_kobo, status, is_coming_soon, product_types(name), product_images(storage_path, sort_order), product_variants(stock_quantity, low_stock_threshold, is_active)",
    )
    .order("updated_at", { ascending: false })
    .limit(200);
  query = filter === "active" ? query.neq("status", "archived") : query.eq("status", filter);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);

  const { data, error } = await query;
  const products = (data ?? []) as unknown as Row[];

  return (
    <>
      <form className="mb-4 flex flex-col gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search products"
          aria-label="Search products"
          className={inputClass}
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              type="submit"
              name="status"
              value={f.value}
              aria-pressed={filter === f.value}
              className="min-h-11 shrink-0 rounded-full border border-line px-4 text-sm text-ink-muted aria-pressed:border-silver aria-pressed:bg-surface-2 aria-pressed:text-silver-strong"
            >
              {f.label}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="text-sm text-danger">Couldn’t load products. Please reload.</p>}

      {products.length === 0 ? (
        <EmptyState>{q ? "No products match your search." : "No products here yet. Tap “+ New” to add one."}</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {products.map((product) => {
            const cover = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
            const variants = product.product_variants.filter((v) => v.is_active);
            const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
            const lowCount = variants.filter((v) => stockLevel(v) === "low").length;
            const outCount = variants.filter((v) => stockLevel(v) === "out").length;
            return (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex min-h-24 items-center gap-4 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-silver"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    {cover ? (
                      <Image src={catalogueImageUrl(cover.storage_path)} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] uppercase text-ink-muted">No photo</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-ink">{product.name}</p>
                    <p className="text-sm text-ink-muted">
                      {formatNaira(product.price_kobo)} · {product.product_types?.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={product.status} />
                      {product.is_coming_soon && <Badge>Coming soon</Badge>}
                      {variants.length > 0 && <Badge>{totalStock} in stock</Badge>}
                      {outCount > 0 && <Badge tone="bad">{outCount} sold out</Badge>}
                      {lowCount > 0 && <Badge tone="warn">{lowCount} low</Badge>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
