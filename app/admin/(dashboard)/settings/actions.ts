"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type ActionState,
  dbFailure,
  failure,
  success,
  validationFailure,
} from "@/lib/admin/action-state";
import { moveInList, saveOrder, uniqueSlug } from "@/lib/admin/catalogue";

type ListTable = "product_types" | "sizes";
const tables = z.enum(["product_types", "sizes"]);

const labels: Record<ListTable, { column: "name" | "label"; max: number; noun: string }> = {
  product_types: { column: "name", max: 80, noun: "product type" },
  sizes: { column: "label", max: 20, noun: "size" },
};

function nameSchema(table: ListTable) {
  const { max, noun } = labels[table];
  return z.string().trim().min(1, `Enter the ${noun} name.`).max(max, `That ${noun} name is too long.`);
}

export async function addListItem(table: ListTable, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const t = tables.safeParse(table);
  if (!t.success) return failure("Something went wrong — please reload the page.");
  const name = nameSchema(t.data).safeParse(formData.get("name"));
  if (!name.success) return validationFailure(name.error);

  const supabase = await createClient();
  const { data: last } = await supabase
    .from(t.data)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row: Record<string, unknown> = { [labels[t.data].column]: name.data, sort_order: (last?.sort_order ?? 0) + 10 };
  if (t.data === "product_types") row.slug = await uniqueSlug(supabase, "product_types", name.data);

  const { error } = await supabase.from(t.data).insert(row);
  if (error) return dbFailure(error);

  refresh();
  return success(`Added “${name.data}”.`);
}

export async function renameListItem(
  table: ListTable,
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const t = tables.safeParse(table);
  const rowId = z.uuid().safeParse(id);
  if (!t.success || !rowId.success) return failure("Something went wrong — please reload the page.");
  const name = nameSchema(t.data).safeParse(formData.get("name"));
  if (!name.success) return validationFailure(name.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from(t.data)
    .update({ [labels[t.data].column]: name.data })
    .eq("id", rowId.data);
  if (error) return dbFailure(error);

  refresh();
  return success("Saved.");
}

export async function moveListItem(table: ListTable, id: string, direction: -1 | 1): Promise<ActionState> {
  await requireAdmin();
  const t = tables.safeParse(table);
  const rowId = z.uuid().safeParse(id);
  if (!t.success || !rowId.success) return failure("Something went wrong — please reload the page.");

  const supabase = await createClient();
  const { data } = await supabase.from(t.data).select("id").order("sort_order");
  const order = moveInList((data ?? []).map((row) => row.id as string), rowId.data, direction);
  if (!order) return success("");

  const error = await saveOrder(supabase, t.data, order);
  if (error) return dbFailure(error);
  refresh();
  return success("Order saved.");
}

export async function deleteListItem(table: ListTable, id: string): Promise<ActionState> {
  await requireAdmin();
  const t = tables.safeParse(table);
  const rowId = z.uuid().safeParse(id);
  if (!t.success || !rowId.success) return failure("Something went wrong — please reload the page.");

  const supabase = await createClient();
  const { error } = await supabase.from(t.data).delete().eq("id", rowId.data);
  if (error?.code === "23503") {
    return failure(`This ${labels[t.data].noun} is used by products, so it can't be deleted.`);
  }
  if (error) return dbFailure(error);

  refresh();
  return success("Deleted.");
}
