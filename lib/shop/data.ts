import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { CATALOGUE_TAG } from "@/lib/shop/cache";
import type { SizeGuideChart } from "@/lib/admin/catalogue";

// Everything the storefront shows is read here, as an anonymous shopper, so
// drafts and private data can never leak. Results are cached and refreshed
// whenever the admin changes something (see lib/shop/cache.ts).

export type ShopColour = { id: string; name: string; hex: string | null };
export type ShopImage = { path: string; alt: string | null; colourId: string | null };
export type ShopVariant = {
  id: string;
  sizeId: string | null;
  sizeLabel: string | null;
  sizeSort: number;
  colourId: string | null;
  stock: number;
};
export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceKobo: number;
  isNew: boolean;
  isFeatured: boolean;
  isComingSoon: boolean;
  publishedAt: string | null;
  lowStock: number;
  typeId: string;
  sizeGuideId: string | null;
  colours: ShopColour[];
  images: ShopImage[];
  variants: ShopVariant[];
  collectionIds: string[];
  /** Can be bought right now (not Coming soon and at least one size in stock). */
  inStock: boolean;
};
export type ShopCollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverPath: string | null;
  isFeatured: boolean;
  productIds: string[];
};
export type ShopType = { id: string; name: string; slug: string };
export type ShopSize = { id: string; label: string };
export type ShopSizeGuide = { id: string; name: string; unit: string; chart: SizeGuideChart; notes: string | null };
export type Catalogue = {
  products: ShopProduct[];
  collections: ShopCollection[];
  types: ShopType[];
  sizes: ShopSize[];
  sizeGuides: ShopSizeGuide[];
};

export type GalleryKind = "founder" | "model" | "customer" | "campaign" | "editorial" | "concept";
export type GalleryPhoto = {
  id: string;
  path: string;
  caption: string | null;
  kind: GalleryKind;
  product: { slug: string; name: string } | null;
};

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Could not load ${what}: ${error?.message ?? "unknown error"}`);
}

/** The whole published catalogue. Small enough to load in one go and filter on the server. */
export async function getCatalogue(): Promise<Catalogue> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAG);

  const supabase = createPublicClient();
  const [products, colours, images, variants, sizes, types, collections, members, guides] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, slug, name, description, price_kobo, is_new_arrival, is_featured, is_coming_soon, published_at, low_stock_threshold, product_type_id, size_guide_id",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase.from("product_colours").select("id, product_id, name, hex, sort_order").order("sort_order"),
    supabase.from("product_images").select("product_id, colour_id, storage_path, alt_text, sort_order").order("sort_order"),
    supabase
      .from("product_variants")
      .select("id, product_id, size_id, colour_id, stock_quantity")
      .eq("is_active", true),
    supabase.from("sizes").select("id, label, sort_order").order("sort_order"),
    supabase.from("product_types").select("id, name, slug, sort_order").order("sort_order"),
    supabase
      .from("collections")
      .select("id, slug, name, description, cover_image_path, is_featured, sort_order")
      .eq("is_published", true)
      .order("sort_order"),
    supabase.from("collection_products").select("collection_id, product_id, sort_order").order("sort_order"),
    supabase.from("size_guides").select("id, name, unit, chart, notes"),
  ]);

  for (const [what, result] of Object.entries({ products, colours, images, variants, sizes, types, collections, members, guides })) {
    if (result.error) fail(what, result.error);
  }

  const sizeById = new Map(sizes.data!.map((size) => [size.id, size]));
  const byProduct = <T extends { product_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) map.set(row.product_id, [...(map.get(row.product_id) ?? []), row]);
    return map;
  };
  const coloursBy = byProduct(colours.data!);
  const imagesBy = byProduct(images.data!);
  const variantsBy = byProduct(variants.data!);
  const membersBy = byProduct(members.data!);

  const shopProducts: ShopProduct[] = products.data!.map((product) => {
    const productVariants: ShopVariant[] = (variantsBy.get(product.id) ?? [])
      .map((variant) => {
        const size = variant.size_id ? sizeById.get(variant.size_id) : undefined;
        return {
          id: variant.id,
          sizeId: variant.size_id,
          sizeLabel: size?.label ?? null,
          sizeSort: size?.sort_order ?? 0,
          colourId: variant.colour_id,
          stock: variant.stock_quantity,
        };
      })
      .sort((a, b) => a.sizeSort - b.sizeSort);

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      priceKobo: product.price_kobo,
      isNew: product.is_new_arrival,
      isFeatured: product.is_featured,
      isComingSoon: product.is_coming_soon,
      publishedAt: product.published_at,
      lowStock: product.low_stock_threshold,
      typeId: product.product_type_id,
      sizeGuideId: product.size_guide_id,
      colours: (coloursBy.get(product.id) ?? []).map(({ id, name, hex }) => ({ id, name, hex })),
      images: (imagesBy.get(product.id) ?? []).map((image) => ({
        path: image.storage_path,
        alt: image.alt_text,
        colourId: image.colour_id,
      })),
      variants: productVariants,
      collectionIds: (membersBy.get(product.id) ?? []).map((member) => member.collection_id),
      inStock: !product.is_coming_soon && productVariants.some((variant) => variant.stock > 0),
    };
  });

  const publishedIds = new Set(shopProducts.map((product) => product.id));
  const shopCollections: ShopCollection[] = collections.data!.map((collection) => ({
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    coverPath: collection.cover_image_path,
    isFeatured: collection.is_featured,
    productIds: members
      .data!.filter((member) => member.collection_id === collection.id && publishedIds.has(member.product_id))
      .map((member) => member.product_id),
  }));

  return {
    products: shopProducts,
    collections: shopCollections,
    types: types.data!.map(({ id, name, slug }) => ({ id, name, slug })),
    sizes: sizes.data!.map(({ id, label }) => ({ id, label })),
    sizeGuides: guides.data!.map((guide) => ({
      id: guide.id,
      name: guide.name,
      unit: guide.unit,
      chart: guide.chart as SizeGuideChart,
      notes: guide.notes,
    })),
  };
}

/** Published LVN Gallery photos, in the owner's order. */
export async function getGallery(): Promise<GalleryPhoto[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAG);

  const supabase = createPublicClient();
  const [{ data, error }, catalogue] = await Promise.all([
    supabase
      .from("gallery_images")
      .select("id, storage_path, caption, kind, product_id")
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at", { ascending: false }),
    getCatalogue(),
  ]);
  // Before the gallery table exists (migration 0003 not run yet) show an empty gallery.
  if (error) return [];

  const products = new Map(catalogue.products.map((product) => [product.id, product]));
  return data.map((row) => {
    const product = row.product_id ? products.get(row.product_id) : undefined;
    return {
      id: row.id,
      path: row.storage_path,
      caption: row.caption,
      kind: row.kind as GalleryKind,
      product: product ? { slug: product.slug, name: product.name } : null,
    };
  });
}

// ── Helpers shared by pages (pure, no fetching) ──────────────────────────────

/** First photo for each colour (falls back to the first photo overall). */
export function colourImages(product: ShopProduct): { colour: ShopColour | null; image: ShopImage | null }[] {
  if (product.colours.length === 0) return [{ colour: null, image: product.images[0] ?? null }];
  return product.colours.map((colour) => ({
    colour,
    image: product.images.find((image) => image.colourId === colour.id) ?? product.images[0] ?? null,
  }));
}

/** New arrivals: products the owner marked "New", otherwise the most recently published. */
export function newArrivals(products: ShopProduct[], limit = 8): ShopProduct[] {
  const buyable = products.filter((product) => !product.isComingSoon);
  const marked = buyable.filter((product) => product.isNew);
  return (marked.length ? marked : buyable).slice(0, limit);
}

export function productsIn(catalogue: Catalogue, collection: ShopCollection): ShopProduct[] {
  const byId = new Map(catalogue.products.map((product) => [product.id, product]));
  return collection.productIds.map((id) => byId.get(id)).filter((product): product is ShopProduct => Boolean(product));
}
