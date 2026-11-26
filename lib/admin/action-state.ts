import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";

/** Result returned by admin Server Actions and shown under the form. */
export type ActionState = { ok: boolean; message: string | null };

export const idle: ActionState = { ok: false, message: null };

export function success(message: string): ActionState {
  return { ok: true, message };
}

export function failure(message: string): ActionState {
  return { ok: false, message };
}

export function validationFailure(error: z.ZodError): ActionState {
  return failure(error.issues[0]?.message ?? "Please check the form.");
}

/** Turns a database error into a plain-English message for the owner. */
export function dbFailure(error: PostgrestError | { message: string; code?: string }): ActionState {
  const code = "code" in error ? error.code : undefined;
  switch (code) {
    case "P0001": // our own rule messages (publishing, ordered items)
    case "22023":
    case "P0002":
      return failure(error.message);
    case "23505":
      return failure("That name is already in use. Choose a different one.");
    case "23503":
      return failure("This is still being used elsewhere, so it can't be removed.");
    case "42501":
      return failure("You don't have permission to do that.");
    default:
      console.error("Admin database error", error);
      return failure("Something went wrong saving that. Please try again.");
  }
}
