"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CATALOGUE_BUCKET } from "@/lib/storage";
import { catalogueChanged } from "@/lib/shop/cache";
import { type ActionState, dbFailure, failure, success, validationFailure } from "@/lib/admin/action-state";
import { moveInList, saveOrder } from "@/lib/admin/catalogue";

const uuid = z.uuid("Something went wrong — please reload the page.");
const galleryPath = z.string().regex(/^gallery\/[0-9a-f-]{36}\.jpg$/, "Upload failed — please try again.");
const kinds = ["founder", "model", "customer", "campaign", "editorial", "concept"] as const;

function done(message: string): ActionState {
  refresh();
  catalogueChanged();
  return success(message);
}

/** Record photos that the browser has already uploaded to storage. Newest go first. */
export async function recordGalleryImages(paths: string[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = z.array(galleryPath).min(1).max(30).safeParse(paths);
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { data: first } = await supabase.from("gallery_images").select("sort_order").order("sort_order").limit(1).maybeSingle();
  const start = (first?.sort_order ?? 0) - 10 * parsed.data.length;
  const { error } = await supabase
    .from("gallery_images")
    .insert(parsed.data.map((storage_path, i) => ({ storage_path, sort_order: start + i * 10 })));
  if (error) return dbFailure(error);
  return done(parsed.data.length === 1 ? "Photo added to the gallery." : `${parsed.data.length} photos added to the gallery.`);
}

export async function updateGalleryImage(imageId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: uuid,
      caption: z.string().trim().max(200, "Captions are 200 characters max."),
      kind: z.enum(kinds, "Choose what kind of photo this is."),
      product_id: z.union([uuid, z.literal("")]),
    })
    .safeParse({
      id: imageId,
      caption: formData.get("caption") ?? "",
      kind: formData.get("kind"),
      product_id: formData.get("product_id") ?? "",
    });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .update({
      caption: parsed.data.caption || null,
      kind: parsed.data.kind,
      product_id: parsed.data.product_id || null,
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", parsed.data.id);
  if (error) return dbFailure(error);
  return done("Saved.");
}

export async function moveGalleryImage(imageId: string, direction: -1 | 1): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.safeParse(imageId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_images").select("id").order("sort_order").order("created_at", { ascending: false });
  if (error) return dbFailure(error);
  const ids = moveInList(data.map((row) => row.id as string), id.data, direction);
  if (!ids) return failure("That photo can't move any further.");
  const saveError = await saveOrder(supabase, "gallery_images", ids);
  if (saveError) return dbFailure(saveError);
  return done("Order saved.");
}

export async function deleteGalleryImage(imageId: string): Promise<ActionState> {
  await requireAdmin();
  const id = uuid.safeParse(imageId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_images").delete().eq("id", id.data).select("storage_path").maybeSingle();
  if (error) return dbFailure(error);
  if (data?.storage_path) await supabase.storage.from(CATALOGUE_BUCKET).remove([data.storage_path]);
  return done("Photo removed.");
}
