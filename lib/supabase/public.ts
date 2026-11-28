import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Cookie-free Supabase client acting as an anonymous shopper. Row Level
 * Security limits it to published products, collections and gallery photos.
 * Safe to use inside "use cache" functions because it never reads cookies.
 */
export function createPublicClient() {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
