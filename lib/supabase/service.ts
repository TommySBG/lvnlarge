import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Supabase client with the SECRET key. It bypasses Row Level Security, so use
 * it only in trusted server code (sign-ups, bags, orders, Paystack webhooks)
 * after validating input. Never import this from a Client Component.
 */
export function createServiceClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing environment variable SUPABASE_SECRET_KEY.");
  }

  return createClient(publicEnv.supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
