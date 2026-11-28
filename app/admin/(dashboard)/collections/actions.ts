"use server";

import { refresh } from "next/cache";
import { catalogueChanged } from "@/lib/shop/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CATALOGUE_BUCKET } from "@/lib/storage";
import {
  type ActionState,
  dbFailure,
  failure,
  success,
  validationFailure,
} from "@/lib/admin/action-state";
import { moveInList, saveOrder, uniqueSlug } from "@/lib/admin/catalogue";

const uuid = z.uuid("Something went wrong — please reload the page.");
const collectionName = z
  .string()
  .trim()
  .min(1, "Enter the collection name.")
  .max(120, "Collection names are 120 characters max.");

export async function createCollection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = collectionName.safeParse(formData.get("name"));
  if (!name.success) return validationFailure(name.error);

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("collections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("collections")
    .insert({
      name: name.data,
      slug: await uniqueSlug(supabase, "collections", name.data),
      sort_order: (last?.sort_order ?? 0) + 10,
    })
    .select("id")
    .single();
  if (error) return dbFailure(error);

  redirect(`/admin/collections/${data.id}`);
}

export async function updateCollection(
  collectionId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: uuid,
      name: collectionName,
      description: z.string().trim().max(3000, "The description is too long."),
    })
    .safeParse({ id: collectionId, name: formData.get("name"), description: formData.get("description") ?? "" });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("collections")
    .select("name, is_published")
    .eq("id", parsed.data.id)
    .single();
  if (loadError) return dbFailure(loadError);

  const isPublished = formData.get("is_published") === "on";
  // Web address follows the name only while the collection has never been shown.
  const slug =
    !current.is_published && !isPublished && current.name !== parsed.data.name
      ? await uniqueSlug(supabase, "collections", parsed.data.name, parsed.data.id)
      : undefined;

  const { error } = await supabase
    .from("collections")
    .update({
      name: parsed.data.name,
      ...(slug ? { slug } : {}),
      description: parsed.data.description || null,
      is_featured: formData.get("is_featured") === "on",
      is_published: isPublished,
    })
    .eq("id", parsed.data.id);
  if (error) return dbFailure(error);

  refresh();
  catalogueChanged();
  return success("Collection saved.");
}

export async function moveCollection(collectionId: string, direction: -1 | 1): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.safeParse(collectionId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("id").order("sort_order").order("name");
  const order = moveInList((data ?? []).map((row) => row.id as string), id.data, direction);
  if (!order) return success("");

  const error = await saveOrder(supabase, "collections", order);
  if (error) return dbFailure(error);
  refresh();
  catalogueChanged();
  return success("Order saved.");
}

export async function deleteCollection(collectionId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  void _formData;
  await requireAdmin();
  const id = uuid.safeParse(collectionId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id.data)
    .select("cover_image_path")
    .single();
  if (error) return dbFailure(error);
  if (data.cover_image_path) await supabase.storage.from(CATALOGUE_BUCKET).remove([data.cover_image_path]);

  catalogueChanged();
  redirect("/admin/collections");
}

// Cover photo: uploaded from the browser to storage first, then recorded here.
export async function setCollectionCover(collectionId: string, path: string): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ id: uuid, path: z.string().regex(/^collections\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/) })
    .safeParse({ id: collectionId, path });
  if (!parsed.success || !parsed.data.path.startsWith(`collections/${collectionId}/`)) {
    return failure("Upload failed — please try again.");
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("collections")
    .select("cover_image_path")
    .eq("id", collectionId)
    .single();
  const { error } = await supabase.from("collections").update({ cover_image_path: path }).eq("id", collectionId);
  if (error) {
    await supabase.storage.from(CATALOGUE_BUCKET).remove([path]);
    return dbFailure(error);
  }
  if (current?.cover_image_path) await supabase.storage.from(CATALOGUE_BUCKET).remove([current.cover_image_path]);

  refresh();
  catalogueChanged();
  return success("Cover photo saved.");
}

export async function removeCollectionCover(collectionId: string): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.safeParse(collectionId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data: current } = await supabase.from("collections").select("cover_image_path").eq("id", id.data).single();
  const { error } = await supabase.from("collections").update({ cover_image_path: null }).eq("id", id.data);
  if (error) return dbFailure(error);
  if (current?.cover_image_path) await supabase.storage.from(CATALOGUE_BUCKET).remove([current.cover_image_path]);

  refresh();
  catalogueChanged();
  return success("Cover photo removed.");
}

// Products inside a collection
export async function addProductToCollection(
  collectionId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ id: uuid, productId: z.uuid("Choose a product to add.") })
    .safeParse({ id: collectionId, productId: formData.get("product_id") });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("collection_products")
    .select("sort_order")
    .eq("collection_id", parsed.data.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("collection_products").insert({
    collection_id: parsed.data.id,
    product_id: parsed.data.productId,
    sort_order: (last?.sort_order ?? 0) + 10,
  });
  if (error?.code === "23505") return failure("That product is already in this collection.");
  if (error) return dbFailure(error);

  refresh();
  catalogueChanged();
  return success("Product added.");
}

export async function removeProductFromCollection(collectionId: string, productId: string): Promise<ActionState> {
  await requireAdmin();
  const parsed = z.object({ id: uuid, productId: uuid }).safeParse({ id: collectionId, productId });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("collection_products")
    .delete()
    .eq("collection_id", parsed.data.id)
    .eq("product_id", parsed.data.productId);
  if (error) return dbFailure(error);

  refresh();
  catalogueChanged();
  return success("Product removed from collection.");
}

export async function moveProductInCollection(
  collectionId: string,
  productId: string,
  direction: -1 | 1,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = z.object({ id: uuid, productId: uuid }).safeParse({ id: collectionId, productId });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { data } = await supabase
    .from("collection_products")
    .select("product_id")
    .eq("collection_id", parsed.data.id)
    .order("sort_order");
  const order = moveInList((data ?? []).map((row) => row.product_id as string), parsed.data.productId, direction);
  if (!order) return success("");

  for (const [index, id] of order.entries()) {
    const { error } = await supabase
      .from("collection_products")
      .update({ sort_order: (index + 1) * 10 })
      .eq("collection_id", parsed.data.id)
      .eq("product_id", id);
    if (error) return dbFailure(error);
  }

  refresh();
  catalogueChanged();
  return success("Order saved.");
}
