import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCatalogue } from "@/lib/shop/data";
import { toCard } from "@/lib/shop/card";
import { applyFilters, filterOptions, parseFilters } from "@/lib/shop/filters";
import { FilterBar } from "@/components/shop/filter-bar";
import { ProductGrid } from "@/components/shop/product-card";
import { PageIntro } from "@/components/shop/ui";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Every LVN’LARGE piece in one place — polos, tees, joggers, caps and more.",
};

export default function ShopAllPage({ searchParams }: PageProps<"/shop">) {
  return (
    <>
      <PageIntro eyebrow="LVN’LARGE" title="Shop All" />
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
        <Suspense fallback={<GridSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  const [params, catalogue] = await Promise.all([searchParams, getCatalogue()]);
  const filters = parseFilters(params);
  const products = applyFilters(catalogue, filters);

  return (
    <>
      <FilterBar filters={filters} options={filterOptions(catalogue)} count={products.length} />
      {filters.q && (
        <p className="pt-6 text-sm text-ink-muted">
          {products.length} {products.length === 1 ? "result" : "results"} for <span className="text-ink">“{filters.q}”</span>
        </p>
      )}
      <div className="pt-6">
        {products.length ? (
          <ProductGrid cards={products.map(toCard)} />
        ) : (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="font-display text-3xl uppercase tracking-wide text-silver-strong">Nothing here yet</p>
            <p className="max-w-sm text-sm text-ink-muted">
              {catalogue.products.length ? "No pieces match those filters. Try removing one." : "New pieces are being added. Check back soon."}
            </p>
            {catalogue.products.length > 0 && (
              <Link href="/shop" className="text-xs uppercase tracking-[0.25em] text-silver-strong underline underline-offset-4">
                Clear filters
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 pt-20 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-surface" />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-surface" />
        </div>
      ))}
    </div>
  );
}
