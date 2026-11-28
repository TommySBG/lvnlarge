"use server";

import { refresh } from "next/cache";
import { catalogueChanged } from "@/lib/shop/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseNairaToKobo } from "@/lib/format";
import { CATALOGUE_BUCKET } from "@/lib/storage";
import {
  type ActionState,
  dbFailure,
  failure,
  success,
  validationFailure,
} from "@/lib/admin/action-state";
import { moveInList, saveOrder, uniqueSlug, type ProductStatus } from "@/lib/admin/catalogue";

const uuid = z.uuid("Something went wrong — please reload the page.");

const price = z
  .string()
  .transform((value, ctx) => {
    const kobo = parseNairaToKobo(value);
    if (kobo === null || kobo <= 0 || kobo > 1_000_000_000) {
      ctx.addIssue({ code: "custom", message: "Enter a price in naira, e.g. 15000." });
      return z.NEVER;
    }
    return kobo;
  });

const productName = z
  .string()
  .trim()
  .min(1, "Enter the product name.")
  .max(160, "The product name is too long (160 characters max).");

const checkbox = (formData: FormData, name: string) => formData.get(name) === "on";

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ name: productName, product_type_id: uuid, price })
    .safeParse({
      name: formData.get("name"),
      product_type_id: formData.get("product_type_id"),
      price: formData.get("price"),
    });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, "products", parsed.data.name);
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      slug,
      product_type_id: parsed.data.product_type_id,
      price_kobo: parsed.data.price,
    })
    .select("id")
    .single();
  if (error) return dbFailure(error);

  redirect(`/admin/products/${data.id}`);
}

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------
export async function updateProductDetails(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: uuid,
      name: productName,
      product_type_id: uuid,
      price,
      description: z.string().trim().max(5000, "The description is too long."),
      size_guide_id: z.union([uuid, z.literal("")]),
      low_stock_threshold: z.coerce
        .number("Enter a number for the low-stock warning.")
        .int("Use a whole number for the low-stock warning.")
        .min(0, "The low-stock warning can't be negative.")
        .max(1000, "The low-stock warning is too high."),
    })
    .safeParse({
      id: productId,
      name: formData.get("name"),
      product_type_id: formData.get("product_type_id"),
      price: formData.get("price"),
      description: formData.get("description") ?? "",
      size_guide_id: formData.get("size_guide_id") ?? "",
      low_stock_threshold: formData.get("low_stock_threshold"),
    });
  if (!parsed.success) return validationFailure(parsed.error);
  const input = parsed.data;

  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("products")
    .select("name, published_at")
    .eq("id", input.id)
    .single();
  if (loadError) return dbFailure(loadError);

  // The web address follows the name until the product is first published,
  // then stays fixed so shared links keep working.
  const slug =
    current.published_at === null && current.name !== input.name
      ? await uniqueSlug(supabase, "products", input.name, input.id)
      : undefined;

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      ...(slug ? { slug } : {}),
      product_type_id: input.product_type_id,
      price_kobo: input.price,
      description: input.description || null,
      size_guide_id: input.size_guide_id || null,
      low_stock_threshold: input.low_stock_threshold,
      is_featured: checkbox(formData, "is_featured"),
      is_new_arrival: checkbox(formData, "is_new_arrival"),
      is_coming_soon: checkbox(formData, "is_coming_soon"),
      allow_preorder: checkbox(formData, "allow_preorder"),
    })
    .eq("id", input.id);
  if (error) return dbFailure(error);

  const { error: variantError } = await supabase
    .from("product_variants")
    .update({ low_stock_threshold: input.low_stock_threshold })
    .eq("product_id", input.id);
  if (variantError) return dbFailure(variantError);

  refresh();
  catalogueChanged();
  return success("Details saved.");
}

// ---------------------------------------------------------------------------
// Publish / unpublish / archive / delete
// ---------------------------------------------------------------------------
const statusMessages: Record<ProductStatus, string> = {
  published: "Published — it's now visible in the shop.",
  draft: "Moved back to draft — hidden from the shop.",
  archived: "Archived — hidden from the shop and the products list.",
};

export async function setProductStatus(
  productId: string,
  status: ProductStatus,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  void _formData;
  await requireAdmin();
  const parsed = z
    .object({ id: uuid, status: z.enum(["draft", "published", "archived"]) })
    .safeParse({ id: productId, status });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) return dbFailure(error);

  refresh();
  catalogueChanged();
  return success(statusMessages[parsed.data.status]);
}

export async function deleteProduct(productId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  void _formData;
  await requireAdmin();
  const id = uuid.safeParse(productId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id.data);

  // The database refuses this if the product has ever been ordered.
  const { error } = await supabase.from("products").delete().eq("id", id.data);
  if (error) return dbFailure(error);

  const paths = (images ?? []).map((image) => image.storage_path as string);
  if (paths.length) await supabase.storage.from(CATALOGUE_BUCKET).remove(paths);

  catalogueChanged();
  redirect("/admin/products");
}

// ---------------------------------------------------------------------------
// Sizes & colours → variants
// ---------------------------------------------------------------------------
const colourInput = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Every colour needs a name.").max(60, "Colour names are 60 characters max."),
  hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pick a colour for the swatch.")
    .nullable(),
});

export async function saveProductOptions(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  let colourJson: unknown;
  try {
    colourJson = JSON.parse(String(formData.get("colours") ?? "[]"));
  } catch {
    return failure("Something went wrong — please reload the page.");
  }

  const parsed = z
    .object({
      id: uuid,
      sizeIds: z.array(uuid).min(1, "Tick at least one size (use One Size for caps)."),
      colours: z.array(colourInput).max(20, "That's a lot of colours — 20 max."),
    })
    .safeParse({ id: productId, sizeIds: formData.getAll("sizes"), colours: colourJson });
  if (!parsed.success) return validationFailure(parsed.error);
  const { id, sizeIds, colours } = parsed.data;

  const names = colours.map((colour) => colour.name.toLowerCase());
  if (new Set(names).size !== names.length) return failure("Two colours have the same name.");

  const supabase = await createClient();
  const [{ data: product, error: productError }, { data: existingColours }, { data: existingVariants }] =
    await Promise.all([
      supabase.from("products").select("low_stock_threshold").eq("id", id).single(),
      supabase.from("product_colours").select("id, name").eq("product_id", id),
      supabase.from("product_variants").select("id, size_id, colour_id, is_active").eq("product_id", id),
    ]);
  if (productError) return dbFailure(productError);

  let keptOrdered = 0;

  // A colour added on screen has no id until the page reloads; match it to a
  // saved colour of the same name so saving twice never creates duplicates.
  const existingByName = new Map((existingColours ?? []).map((c) => [String(c.name).toLowerCase(), c.id as string]));
  const existingIds = new Set((existingColours ?? []).map((c) => c.id as string));
  for (const colour of colours) {
    if (colour.id && !existingIds.has(colour.id)) colour.id = undefined;
    if (!colour.id) colour.id = existingByName.get(colour.name.toLowerCase());
  }

  // 1. Colours: update existing, add new, remove the rest.
  const keepColourIds = new Set(colours.flatMap((colour) => (colour.id ? [colour.id] : [])));
  for (const colour of existingColours ?? []) {
    if (keepColourIds.has(colour.id)) continue;
    const { error } = await supabase.from("product_colours").delete().eq("id", colour.id);
    if (error?.code === "P0001") {
      // Ordered before: keep the colour but switch its sizes off.
      keptOrdered++;
      await supabase.from("product_variants").update({ is_active: false }).eq("colour_id", colour.id);
    } else if (error) {
      return dbFailure(error);
    }
  }

  const colourIds: string[] = [];
  for (const [index, colour] of colours.entries()) {
    const values = { name: colour.name, hex: colour.hex, sort_order: (index + 1) * 10 };
    if (colour.id) {
      const { error } = await supabase.from("product_colours").update(values).eq("id", colour.id).eq("product_id", id);
      if (error) return dbFailure(error);
      colourIds.push(colour.id);
    } else {
      const { data, error } = await supabase
        .from("product_colours")
        .insert({ ...values, product_id: id })
        .select("id")
        .single();
      if (error) return dbFailure(error);
      colourIds.push(data.id);
    }
  }

  // 2. Variants: one per size × colour (or per size if no colours).
  const wanted = new Set<string>();
  const colourChoices: (string | null)[] = colourIds.length ? colourIds : [null];
  for (const sizeId of sizeIds) for (const colourId of colourChoices) wanted.add(`${sizeId}|${colourId}`);

  const existingKeys = new Set<string>();
  for (const variant of existingVariants ?? []) {
    const key = `${variant.size_id}|${variant.colour_id}`;
    existingKeys.add(key);
    if (wanted.has(key)) {
      if (!variant.is_active) {
        await supabase.from("product_variants").update({ is_active: true }).eq("id", variant.id);
      }
      continue;
    }
    const { error } = await supabase.from("product_variants").delete().eq("id", variant.id);
    if (error?.code === "P0001") {
      keptOrdered++;
      await supabase.from("product_variants").update({ is_active: false }).eq("id", variant.id);
    } else if (error && error.code !== "PGRST116") {
      return dbFailure(error);
    }
  }

  const toInsert = [...wanted]
    .filter((key) => !existingKeys.has(key))
    .map((key) => {
      const [sizeId, colourId] = key.split("|");
      return {
        product_id: id,
        size_id: sizeId,
        colour_id: colourId === "null" ? null : colourId,
        low_stock_threshold: product.low_stock_threshold,
      };
    });
  if (toInsert.length) {
    const { error } = await supabase.from("product_variants").insert(toInsert);
    if (error) return dbFailure(error);
  }

  refresh();
  catalogueChanged();
  return success(
    keptOrdered
      ? "Saved. Some removed sizes/colours have orders, so they were switched off instead of deleted."
      : "Sizes and colours saved. Now enter the stock below.",
  );
}

// ---------------------------------------------------------------------------
// Stock grid
// ---------------------------------------------------------------------------
export async function saveStock(productId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.safeParse(productId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id, stock_quantity")
    .eq("product_id", id.data)
    .eq("is_active", true);
  if (error) return dbFailure(error);

  const quantity = z.coerce
    .number("Stock must be a number.")
    .int("Stock must be a whole number.")
    .min(0, "Stock can't be negative.")
    .max(100000, "That stock number is too high.");

  let changed = 0;
  for (const variant of variants ?? []) {
    const raw = formData.get(`stock:${variant.id}`);
    if (raw === null || String(raw).trim() === "") continue;
    const parsed = quantity.safeParse(raw);
    if (!parsed.success) return validationFailure(parsed.error);
    if (parsed.data === variant.stock_quantity) continue;

    const { error: rpcError } = await supabase.rpc("set_stock", {
      p_variant_id: variant.id,
      p_quantity: parsed.data,
      p_note: "Product page",
    });
    if (rpcError) return dbFailure(rpcError);
    changed++;
  }

  refresh();
  catalogueChanged();
  return success(changed ? `Stock saved (${changed} updated).` : "No stock changes to save.");
}

// ---------------------------------------------------------------------------
// Photos (files are uploaded from the browser straight to storage first)
// ---------------------------------------------------------------------------
export async function recordProductImages(productId: string, paths: string[]): Promise<ActionState> {
  await requireAdmin();
  const prefix = `products/${productId}/`;
  const parsed = z
    .object({
      id: uuid,
      paths: z
        .array(z.string().regex(/^products\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/))
        .min(1)
        .max(30)
        .refine((list) => list.every((path) => path.startsWith(prefix))),
    })
    .safeParse({ id: productId, paths });
  if (!parsed.success) return failure("Upload failed — please try again.");

  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("name").eq("id", productId).single();
  const { data: last } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? 0) + 10;

  const { error } = await supabase.from("product_images").insert(
    parsed.data.paths.map((path, index) => ({
      product_id: productId,
      storage_path: path,
      alt_text: product?.name ?? null,
      sort_order: start + index * 10,
    })),
  );
  if (error) {
    await supabase.storage.from(CATALOGUE_BUCKET).remove(parsed.data.paths);
    return dbFailure(error);
  }

  refresh();
  catalogueChanged();
  return success(paths.length === 1 ? "Photo added." : `${paths.length} photos added.`);
}

export async function setImageColour(imageId: string, colourId: string | null): Promise<ActionState> {
  await requireAdmin();
  const parsed = z.object({ id: uuid, colourId: uuid.nullable() }).safeParse({ id: imageId, colourId });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_images")
    .update({ colour_id: parsed.data.colourId })
    .eq("id", parsed.data.id);
  if (error) return dbFailure(error);

  refresh();
  catalogueChanged();
  return success("Photo colour saved.");
}

export async function moveImage(imageId: string, direction: -1 | 1): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.safeParse(imageId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data: image } = await supabase.from("product_images").select("product_id").eq("id", id.data).single();
  if (!image) return failure("That photo no longer exists.");

  const { data: siblings } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", image.product_id)
    .order("sort_order")
    .order("created_at");
  const order = moveInList((siblings ?? []).map((row) => row.id as string), id.data, direction);
  if (!order) return success("");

  const error = await saveOrder(supabase, "product_images", order);
  if (error) return dbFailure(error);

  refresh();
  catalogueChanged();
  return success("Photo order saved.");
}

export async function deleteImage(imageId: string): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.safeParse(imageId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data: image, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", id.data)
    .select("storage_path")
    .single();
  if (error) return dbFailure(error);

  await supabase.storage.from(CATALOGUE_BUCKET).remove([image.storage_path]);
  refresh();
  catalogueChanged();
  return success("Photo removed.");
}

// ---------------------------------------------------------------------------
// Collections a product belongs to
// ---------------------------------------------------------------------------
export async function setProductCollections(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ id: uuid, collectionIds: z.array(uuid) })
    .safeParse({ id: productId, collectionIds: formData.getAll("collections") });
  if (!parsed.success) return validationFailure(parsed.error);
  const { id, collectionIds } = parsed.data;

  const supabase = await createClient();
  const { data: current, error } = await supabase
    .from("collection_products")
    .select("collection_id")
    .eq("product_id", id);
  if (error) return dbFailure(error);

  const currentIds = new Set((current ?? []).map((row) => row.collection_id as string));
  const wanted = new Set(collectionIds);
  const toRemove = [...currentIds].filter((collectionId) => !wanted.has(collectionId));
  const toAdd = [...wanted].filter((collectionId) => !currentIds.has(collectionId));

  if (toRemove.length) {
    const { error: removeError } = await supabase
      .from("collection_products")
      .delete()
      .eq("product_id", id)
      .in("collection_id", toRemove);
    if (removeError) return dbFailure(removeError);
  }

  for (const collectionId of toAdd) {
    const { data: last } = await supabase
      .from("collection_products")
      .select("sort_order")
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error: addError } = await supabase
      .from("collection_products")
      .insert({ collection_id: collectionId, product_id: id, sort_order: (last?.sort_order ?? 0) + 10 });
    if (addError) return dbFailure(addError);
  }

  refresh();
  catalogueChanged();
  return success("Collections saved.");
}
