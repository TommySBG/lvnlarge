import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatNaira } from "@/lib/format";
import { catalogueImageUrl } from "@/lib/storage";
import { getCatalogue, type Catalogue, type ShopProduct } from "@/lib/shop/data";
import { toCard } from "@/lib/shop/card";
import { ProductCard } from "@/components/shop/product-card";
import { ProductView, type ProductViewData } from "@/components/shop/product/product-view";
import { SectionHeading } from "@/components/shop/ui";

const COMPLETE_THE_LOOK = "combine-you"; // Collection F: styled combinations

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getCatalogue()).products.find((item) => item.slug === slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0];
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `${product.name} by LVN’LARGE.`,
    openGraph: image ? { images: [catalogueImageUrl(image.path)] } : undefined,
  };
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-[var(--header-total)] sm:px-8 sm:pt-[calc(var(--header-total)+2rem)]">
      <Suspense fallback={<div className="-mx-4 aspect-[4/5] animate-pulse bg-surface sm:mx-0 sm:rounded-3xl lg:w-1/2" />}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/product/[slug]">["params"] }) {
  const { slug } = await params;
  const catalogue = await getCatalogue();
  const product = catalogue.products.find((item) => item.slug === slug);
  if (!product) notFound();

  const { look, related } = suggestions(catalogue, product);

  return (
    <>
      <ProductView product={toViewData(catalogue, product)} />
      {look.length > 0 && <Row title="Complete the Look" eyebrow="Combine you" products={look} />}
      {related.length > 0 && <Row title="You may also like" eyebrow="More LVN’LARGE" products={related} />}
    </>
  );
}

function toViewData(catalogue: Catalogue, product: ShopProduct): ProductViewData {
  const firstCollection = catalogue.collections.find((c) => product.collectionIds.includes(c.id) && c.slug !== COMPLETE_THE_LOOK);
  return {
    name: product.name,
    price: formatNaira(product.priceKobo),
    description: product.description,
    isComingSoon: product.isComingSoon,
    lowStock: product.lowStock,
    typeName: catalogue.types.find((t) => t.id === product.typeId)?.name ?? null,
    collection: firstCollection ? { name: firstCollection.name, slug: firstCollection.slug } : null,
    images: product.images.map((image, index) => {
      const colour = product.colours.find((c) => c.id === image.colourId);
      return {
        url: catalogueImageUrl(image.path),
        alt: image.alt || `${product.name}${colour ? ` in ${colour.name}` : ""} — photo ${index + 1}`,
        colourId: image.colourId,
      };
    }),
    colours: product.colours,
    variants: product.variants.map(({ id, sizeLabel, colourId, stock }) => ({ id, sizeLabel, colourId, stock })),
    sizeGuide: catalogue.sizeGuides.find((guide) => guide.id === product.sizeGuideId) ?? null,
  };
}

/** Complete the Look = other pieces styled with it in Combine You. Related = same collections, then same type. */
function suggestions(catalogue: Catalogue, product: ShopProduct) {
  const others = catalogue.products.filter((p) => p.id !== product.id && !p.isComingSoon);
  const lookCollection = catalogue.collections.find((c) => c.slug === COMPLETE_THE_LOOK && c.productIds.includes(product.id));
  const look = lookCollection ? others.filter((p) => lookCollection.productIds.includes(p.id)).slice(0, 6) : [];
  const lookIds = new Set(look.map((p) => p.id));

  const ownCollections = new Set(product.collectionIds);
  const sameCollection = others.filter((p) => !lookIds.has(p.id) && p.collectionIds.some((id) => ownCollections.has(id)));
  const sameType = others.filter((p) => !lookIds.has(p.id) && p.typeId === product.typeId && !sameCollection.includes(p));
  return { look, related: [...sameCollection, ...sameType].slice(0, 8) };
}

function Row({ title, eyebrow, products }: { title: string; eyebrow: string; products: ShopProduct[] }) {
  return (
    <section className="reveal pt-24">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:gap-5 sm:px-0">
        {products.map((p) => (
          <li key={p.id} className="w-[46vw] max-w-[260px] shrink-0 snap-start">
            <ProductCard card={toCard(p)} sizes="(min-width: 640px) 260px, 46vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
