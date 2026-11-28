// Shop All filters, kept in the web address (?type=polo-shirts&size=M …) so
// filtered pages can be shared and the back button works. Pure functions —
// safe on server and client.

import type { Catalogue, ShopProduct } from "@/lib/shop/data";

export type SortKey = "new" | "price-asc" | "price-desc";
export type Filters = {
  q: string;
  collections: string[];
  types: string[];
  sizes: string[];
  colours: string[];
  /** Naira (not kobo). */
  min: number | null;
  max: number | null;
  inStock: boolean;
  isNew: boolean;
  sort: SortKey;
};

type Params = Record<string, string | string[] | undefined>;

const list = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => item.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 30);

const amount = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw.replace(/[₦,\s]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
};

export function parseFilters(params: Params): Filters {
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  return {
    q: (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 80),
    collections: list(params.collection),
    types: list(params.type),
    sizes: list(params.size),
    colours: list(params.colour).map((colour) => colour.toLowerCase()),
    min: amount(params.min),
    max: amount(params.max),
    inStock: params.instock === "1",
    isNew: params.new === "1",
    sort: sort === "price-asc" || sort === "price-desc" ? sort : "new",
  };
}

export function toSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  for (const value of filters.collections) params.append("collection", value);
  for (const value of filters.types) params.append("type", value);
  for (const value of filters.sizes) params.append("size", value);
  for (const value of filters.colours) params.append("colour", value);
  if (filters.min !== null) params.set("min", String(filters.min));
  if (filters.max !== null) params.set("max", String(filters.max));
  if (filters.inStock) params.set("instock", "1");
  if (filters.isNew) params.set("new", "1");
  if (filters.sort !== "new") params.set("sort", filters.sort);
  return params;
}

export function shopHref(filters: Filters): string {
  const query = toSearchParams(filters).toString();
  return query ? `/shop?${query}` : "/shop";
}

/** Number of filters chosen (search and sort not counted). */
export function activeCount(filters: Filters): number {
  return (
    filters.collections.length +
    filters.types.length +
    filters.sizes.length +
    filters.colours.length +
    (filters.min !== null ? 1 : 0) +
    (filters.max !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.isNew ? 1 : 0)
  );
}

export function applyFilters(catalogue: Catalogue, filters: Filters): ShopProduct[] {
  const collectionIds = new Set(catalogue.collections.filter((c) => filters.collections.includes(c.slug)).map((c) => c.id));
  const typeIds = new Set(catalogue.types.filter((t) => filters.types.includes(t.slug)).map((t) => t.id));
  const words = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
  const typeName = new Map(catalogue.types.map((t) => [t.id, t.name.toLowerCase()]));

  const results = catalogue.products.filter((product) => {
    if (words.length) {
      const haystack = `${product.name} ${product.description ?? ""} ${typeName.get(product.typeId) ?? ""} ${product.colours.map((c) => c.name).join(" ")}`.toLowerCase();
      if (!words.every((word) => haystack.includes(word))) return false;
    }
    if (filters.collections.length && !product.collectionIds.some((id) => collectionIds.has(id))) return false;
    if (filters.types.length && !typeIds.has(product.typeId)) return false;
    if (filters.sizes.length && !product.variants.some((v) => v.stock > 0 && v.sizeLabel && filters.sizes.includes(v.sizeLabel))) return false;
    if (filters.colours.length && !product.colours.some((c) => filters.colours.includes(c.name.toLowerCase()))) return false;
    if (filters.min !== null && product.priceKobo < filters.min * 100) return false;
    if (filters.max !== null && product.priceKobo > filters.max * 100) return false;
    if (filters.inStock && !product.inStock) return false;
    if (filters.isNew && !product.isNew) return false;
    return true;
  });

  if (filters.sort === "price-asc") results.sort((a, b) => a.priceKobo - b.priceKobo);
  else if (filters.sort === "price-desc") results.sort((a, b) => b.priceKobo - a.priceKobo);
  // "new" keeps the catalogue order (newest published first). Coming soon last.
  return results.sort((a, b) => Number(a.isComingSoon) - Number(b.isComingSoon));
}

export type FilterOptions = {
  collections: { value: string; label: string }[];
  types: { value: string; label: string }[];
  sizes: { value: string; label: string }[];
  colours: { value: string; label: string; hex: string | null }[];
};

/** Only offer choices that at least one product actually has. */
export function filterOptions(catalogue: Catalogue): FilterOptions {
  const usedTypes = new Set(catalogue.products.map((p) => p.typeId));
  const usedSizes = new Set(catalogue.products.flatMap((p) => p.variants.map((v) => v.sizeLabel)));
  const colours = new Map<string, { value: string; label: string; hex: string | null }>();
  for (const colour of catalogue.products.flatMap((p) => p.colours)) {
    const key = colour.name.toLowerCase();
    if (!colours.has(key)) colours.set(key, { value: key, label: colour.name, hex: colour.hex });
  }
  return {
    collections: catalogue.collections.filter((c) => c.productIds.length).map((c) => ({ value: c.slug, label: c.name })),
    types: catalogue.types.filter((t) => usedTypes.has(t.id)).map((t) => ({ value: t.slug, label: t.name })),
    sizes: catalogue.sizes.filter((s) => usedSizes.has(s.label)).map((s) => ({ value: s.label, label: s.label })),
    colours: [...colours.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}
