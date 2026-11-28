import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/format";

export type ProductStatus = "draft" | "published" | "archived";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_type_id: string;
  size_guide_id: string | null;
  price_kobo: number;
  status: ProductStatus;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_coming_soon: boolean;
  allow_preorder: boolean;
  low_stock_threshold: number;
  published_at: string | null;
};

export type Size = { id: string; label: string; sort_order: number };
export type ProductType = { id: string; name: string; slug: string; sort_order: number };
export type Colour = { id: string; product_id: string; name: string; hex: string | null; sort_order: number };

export type Variant = {
  id: string;
  product_id: string;
  size_id: string | null;
  colour_id: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  allow_preorder: boolean;
  is_active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  colour_id: string | null;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_path: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

export type SizeGuideChart = { columns: string[]; rows: { size: string; values: string[] }[] };

export type SizeGuide = {
  id: string;
  name: string;
  unit: "inches" | "cm";
  chart: SizeGuideChart;
  notes: string | null;
};

export const DEFAULT_LOW_STOCK = 3; // owner decision

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(variant: Pick<Variant, "stock_quantity" | "low_stock_threshold">): StockLevel {
  if (variant.stock_quantity <= 0) return "out";
  if (variant.stock_quantity <= variant.low_stock_threshold) return "low";
  return "ok";
}

/**
 * A unique URL slug for a table, e.g. "money-motion-swag-c" or
 * "money-motion-swag-c-2" if the first is taken by another row.
 */
export async function uniqueSlug(
  supabase: SupabaseClient,
  table: "products" | "collections" | "product_types",
  name: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(name) || "item";
  const { data } = await supabase.from(table).select("id, slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).filter((row) => row.id !== excludeId).map((row) => row.slug as string));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Rewrites sort_order as 10, 20, 30… in the given id order. */
export async function saveOrder(
  supabase: SupabaseClient,
  table: "collections" | "product_types" | "sizes" | "product_images" | "product_colours" | "gallery_images",
  orderedIds: string[],
) {
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase.from(table).update({ sort_order: (index + 1) * 10 }).eq("id", id);
    if (error) return error;
  }
  return null;
}

/** Moves one id up (-1) or down (+1) in a list. Returns null if it can't move. */
export function moveInList(ids: string[], id: string, direction: -1 | 1): string[] | null {
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
