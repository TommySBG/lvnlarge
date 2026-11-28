import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalogue, productsIn } from "@/lib/shop/data";
import { toCard } from "@/lib/shop/card";
import { toFolder } from "@/lib/shop/folder";
import { CollectionFolder } from "@/components/shop/collection-folder";
import { ProductGrid } from "@/components/shop/product-card";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = (await getCatalogue()).collections.find((item) => item.slug === slug);
  return collection ? { title: collection.name, description: collection.description ?? undefined } : { title: "Collection not found" };
}

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <div className="mx-auto max-w-7xl px-3 pb-24 pt-24 sm:px-8 sm:pt-28">
      <Link href="/collections" className="mb-5 inline-flex min-h-11 items-center px-2 text-xs uppercase tracking-[0.25em] text-ink-muted hover:text-silver-strong">
        ← All collections
      </Link>
      <Suspense fallback={<div className="h-[58svh] animate-pulse rounded-2xl bg-surface" />}>
        <CollectionContent params={params} />
      </Suspense>
    </div>
  );
}

async function CollectionContent({ params }: { params: PageProps<"/collections/[slug]">["params"] }) {
  const { slug } = await params;
  const catalogue = await getCatalogue();
  const index = catalogue.collections.findIndex((item) => item.slug === slug);
  if (index === -1) notFound();
  const collection = catalogue.collections[index];
  const products = productsIn(catalogue, collection);

  return (
    <>
      <div className="animate-rise">
        <CollectionFolder folder={toFolder(catalogue, collection)} index={index} asLink={false} priority />
      </div>
      <section aria-label={`${collection.name} pieces`} className="px-1 pt-12">
        {products.length ? (
          <ProductGrid cards={products.map(toCard)} />
        ) : (
          <p className="text-sm text-ink-muted">New pieces are on the way for this collection.</p>
        )}
      </section>
    </>
  );
}
