import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "@/components/admin/action-buttons";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { ArrowDown, ArrowUp, PageHeader, Section, inputClass } from "@/components/admin/ui";
import { addListItem, deleteListItem, moveListItem, renameListItem } from "./actions";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" back={{ href: "/admin/more", label: "More" }} />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <Lists />
      </Suspense>
    </div>
  );
}

async function Lists() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: types }, { data: sizes }] = await Promise.all([
    supabase.from("product_types").select("id, name").order("sort_order"),
    supabase.from("sizes").select("id, label").order("sort_order"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <EditableList
        table="product_types"
        title="Product types"
        description="Used for the Shop All filter, e.g. Polo Shirts, Joggers, Belts."
        items={(types ?? []).map((t) => ({ id: t.id as string, name: t.name as string }))}
        addPlaceholder="e.g. Beanies"
      />
      <EditableList
        table="sizes"
        title="Sizes"
        description="The order here is the order shoppers see."
        items={(sizes ?? []).map((s) => ({ id: s.id as string, name: s.label as string }))}
        addPlaceholder="e.g. 4XL"
      />
    </div>
  );
}

function EditableList({
  table,
  title,
  description,
  items,
  addPlaceholder,
}: {
  table: "product_types" | "sizes";
  title: string;
  description: string;
  items: { id: string; name: string }[];
  addPlaceholder: string;
}) {
  return (
    <Section title={title} description={description}>
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-lg border border-line p-2">
            <ActionForm action={renameListItem.bind(null, table, item.id)} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input name="name" defaultValue={item.name} required aria-label={`${title} name`} className={inputClass} />
                <SubmitButton variant="secondary" pendingLabel="…" className="shrink-0 px-4">
                  Save
                </SubmitButton>
              </div>
            </ActionForm>
            <div className="mt-2 flex gap-2">
              <ActionButton action={moveListItem.bind(null, table, item.id, -1)} label={`Move ${item.name} up`} disabled={index === 0}>
                <ArrowUp />
              </ActionButton>
              <ActionButton
                action={moveListItem.bind(null, table, item.id, 1)}
                label={`Move ${item.name} down`}
                disabled={index === items.length - 1}
              >
                <ArrowDown />
              </ActionButton>
              <span className="ml-auto">
                <ActionButton
                  action={deleteListItem.bind(null, table, item.id)}
                  confirmText={`Delete “${item.name}”?`}
                  variant="danger"
                >
                  Delete
                </ActionButton>
              </span>
            </div>
          </li>
        ))}
      </ol>
      <ActionForm action={addListItem.bind(null, table)} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input name="name" required placeholder={addPlaceholder} aria-label={`New ${title.toLowerCase()}`} className={inputClass} />
        <SubmitButton pendingLabel="Adding…" className="shrink-0">
          Add
        </SubmitButton>
      </ActionForm>
    </Section>
  );
}
