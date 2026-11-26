import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "owner" | "order_manager" | "inventory_manager" | "marketing_manager";

export type Admin = {
  userId: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
};

/**
 * Returns the logged-in admin, or redirects. Call this in every admin page,
 * Server Action and Route Handler — never rely on the UI alone.
 */
export async function requireAdmin(): Promise<Admin> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("role, display_name")
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/no-access");
  }

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: admin.role as AdminRole,
    displayName: admin.display_name,
  };
}
