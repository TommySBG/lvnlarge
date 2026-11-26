import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Badge, EmptyState, PageHeader, Section, inputClass } from "@/components/admin/ui";
import { createSizeGuide } from "./actions";

export const metadata = { title: "Size guides" };

export default function SizeGuidesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Size guides"
        description="One chart per garment type. Attach a guide to a product on its Details section."
        back={{ href: "/admin/more", label: "More" }}
      />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <GuideList />
      </Suspense>
      <div className="mt-6">
        <Section title="New size guide">
          <ActionForm action={createSizeGuide} className="flex flex-col gap-3 sm:flex-row">
            <input name="name" required maxLength={80} placeholder="e.g. T-shirts" aria-label="Size guide name" className={inputClass} />
            <SubmitButton pendingLabel="Creating…" className="shrink-0">
              Create
            </SubmitButton>
          </ActionForm>
        </Section>
      </div>
    </div>
  );
}

async function GuideList() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("size_guides").select("id, name, unit, products(count)").order("name");
  const guides = (data ?? []) as { id: string; name: string; unit: string; products: { count: number }[] }[];

  if (guides.length === 0) return <EmptyState>No size guides yet. Create one below and fill in the measurements when you have them.</EmptyState>;

  return (
    <ul className="flex flex-col gap-3">
      {guides.map((guide) => (
        <li key={guide.id}>
          <Link
            href={`/admin/size-guides/${guide.id}`}
            className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-silver"
          >
            <span className="text-base font-medium text-ink">{guide.name}</span>
            <span className="flex gap-1.5">
              <Badge>{guide.unit}</Badge>
              <Badge>{guide.products[0]?.count ?? 0} products</Badge>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
