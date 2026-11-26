"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client using the visitor's login cookie. Used by the admin
 * to upload photos straight to storage (storage rules allow admins only).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
