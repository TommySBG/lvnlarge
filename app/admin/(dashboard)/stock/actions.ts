"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type ActionState, dbFailure, success, validationFailure } from "@/lib/admin/action-state";

/** +1 / −1 (or any amount) on one size/colour, recorded in the stock history. */
export async function adjustStock(variantId: string, change: number): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), change: z.number().int().min(-1000).max(1000).refine((n) => n !== 0) })
    .safeParse({ id: variantId, change });
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_stock", {
    p_variant_id: parsed.data.id,
    p_change: parsed.data.change,
    p_note: "Stock page",
  });
  if (error) return dbFailure(error);

  refresh();
  return success(`Stock is now ${data}.`);
}
