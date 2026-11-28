import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { GalleryManager, type GalleryRow } from "./gallery-manager";

export const metadata = { title: "LVN Gallery" };

export default function GalleryAdminPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="LVN Gallery" description="Lookbook photos on the home page and the Gallery page. Newest uploads appear first." />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading photos…</p>}>
        <GalleryList />
      </Suspense>
    </div>
  );
}

async function GalleryList() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: photos, error }, { data: products }] = await Promise.all([
    supabase
      .from("gallery_images")
      .select("id, storage_path, caption, kind, product_id, is_published")
      .order("sort_order")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").neq("status", "archived").order("name"),
  ]);

  if (error) {
    return (
      <EmptyState>
        The gallery isn’t set up in the database yet. Run <strong>supabase/migrations/0003_gallery.sql</strong> in the Supabase SQL Editor, then reload.
      </EmptyState>
    );
  }

  return <GalleryManager photos={(photos ?? []) as GalleryRow[]} products={products ?? []} />;
}
