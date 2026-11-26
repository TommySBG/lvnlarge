import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SizeGuide } from "@/lib/admin/catalogue";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { Field, PageHeader, Section, inputClass, textareaClass } from "@/components/admin/ui";
import { deleteSizeGuide, saveSizeGuide } from "../actions";
import { ChartEditor } from "./chart-editor";

export const metadata = { title: "Edit size guide" };

export default function EditSizeGuidePage({ params }: PageProps<"/admin/size-guides/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <GuideEditor params={params} />
    </Suspense>
  );
}

async function GuideEditor({ params }: { params: PageProps<"/admin/size-guides/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: guide } = await supabase.from("size_guides").select("*").eq("id", id).maybeSingle<SizeGuide>();
  if (!guide) notFound();

  const chart = {
    columns: guide.chart?.columns?.length ? guide.chart.columns : ["Chest", "Length"],
    rows: guide.chart?.rows?.length ? guide.chart.rows : [{ size: "M", values: ["", ""] }],
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={guide.name} back={{ href: "/admin/size-guides", label: "Size guides" }} />
      <div className="flex flex-col gap-4">
        <Section title="Measurements" description="Leave a box empty if you don't have that measurement yet.">
          <ActionForm action={saveSizeGuide.bind(null, guide.id)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name">
                <input name="name" required maxLength={80} defaultValue={guide.name} className={inputClass} />
              </Field>
              <Field label="Unit">
                <select name="unit" defaultValue={guide.unit} className={inputClass}>
                  <option value="inches">Inches</option>
                  <option value="cm">Centimetres</option>
                </select>
              </Field>
            </div>
            <ChartEditor initial={chart} />
            <Field label="Notes" hint="Optional, e.g. “Relaxed fit — size down for a closer fit.”">
              <textarea name="notes" maxLength={1000} defaultValue={guide.notes ?? ""} className={textareaClass} />
            </Field>
            <SubmitButton>Save size guide</SubmitButton>
          </ActionForm>
        </Section>
        <Section title="Delete">
          <ActionForm action={deleteSizeGuide.bind(null, guide.id)}>
            <p className="text-sm text-ink-muted">Products using this guide will show no size guide.</p>
            <ConfirmButton confirmText={`Delete the size guide “${guide.name}”?`}>Delete size guide</ConfirmButton>
          </ActionForm>
        </Section>
      </div>
    </div>
  );
}
