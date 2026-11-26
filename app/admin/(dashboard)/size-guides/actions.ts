"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
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

const guideName = z.string().trim().min(1, "Enter a name, e.g. “T-shirts”.").max(80, "Names are 80 characters max.");

export async function createSizeGuide(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = guideName.safeParse(formData.get("name"));
  if (!name.success) return validationFailure(name.error);

  const supabase = await createClient();
  const { data: sizes } = await supabase.from("sizes").select("label").order("sort_order");
  const chart = {
    columns: ["Chest", "Length"],
    rows: (sizes ?? []).filter((s) => s.label !== "One Size").map((s) => ({ size: s.label, values: ["", ""] })),
  };
  const { data, error } = await supabase.from("size_guides").insert({ name: name.data, chart }).select("id").single();
  if (error) return dbFailure(error);

  redirect(`/admin/size-guides/${data.id}`);
}

const chartSchema = z
  .object({
    columns: z
      .array(z.string().trim().min(1, "Every measurement needs a name, e.g. “Chest”.").max(40))
      .min(1, "Add at least one measurement.")
      .max(10, "10 measurements max."),
    rows: z
      .array(
        z.object({
          size: z.string().trim().min(1, "Every row needs a size.").max(20),
          values: z.array(z.string().trim().max(20, "Measurements are 20 characters max.")),
        }),
      )
      .min(1, "Add at least one size row.")
      .max(20),
  })
  .refine((chart) => chart.rows.every((row) => row.values.length === chart.columns.length), {
    message: "Something went wrong — please reload the page.",
  });

export async function saveSizeGuide(guideId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  let chart: unknown;
  try {
    chart = JSON.parse(String(formData.get("chart") ?? ""));
  } catch {
    return failure("Something went wrong — please reload the page.");
  }

  const parsed = z
    .object({
      id: z.uuid(),
      name: guideName,
      unit: z.enum(["inches", "cm"]),
      notes: z.string().trim().max(1000, "Notes are 1000 characters max."),
      chart: chartSchema,
    })
    .safeParse({
      id: guideId,
      name: formData.get("name"),
      unit: formData.get("unit"),
      notes: formData.get("notes") ?? "",
      chart,
    });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("size_guides")
    .update({
      name: parsed.data.name,
      unit: parsed.data.unit,
      notes: parsed.data.notes || null,
      chart: parsed.data.chart,
    })
    .eq("id", parsed.data.id);
  if (error) return dbFailure(error);

  refresh();
  return success("Size guide saved.");
}

export async function deleteSizeGuide(guideId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  void _formData;
  await requireAdmin();
  const id = z.uuid().safeParse(guideId);
  if (!id.success) return validationFailure(id.error);

  const supabase = await createClient();
  // Products using it simply stop showing a size guide (set to none).
  const { error } = await supabase.from("size_guides").delete().eq("id", id.data);
  if (error) return dbFailure(error);

  redirect("/admin/size-guides");
}
