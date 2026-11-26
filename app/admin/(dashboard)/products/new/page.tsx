import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Field, PageHeader, Section, inputClass } from "@/components/admin/ui";
import { createProduct } from "../actions";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="New product"
        description="Start with the basics. You'll add photos, sizes, colours and stock next."
        back={{ href: "/admin/products", label: "Products" }}
      />
      <Section title="Basics">
        <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
          <NewProductForm />
        </Suspense>
      </Section>
    </div>
  );
}

async function NewProductForm() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: types } = await supabase.from("product_types").select("id, name").order("sort_order");

  return (
    <ActionForm action={createProduct}>
      <Field label="Product name" hint="Use the full name, e.g. “Money Motion Swag C”.">
        <input name="name" required maxLength={160} autoComplete="off" className={inputClass} />
      </Field>
      <Field label="Type">
        <select name="product_type_id" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Choose a type
          </option>
          {(types ?? []).map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Price (₦)">
        <input name="price" required inputMode="decimal" placeholder="15000" className={inputClass} />
      </Field>
      <SubmitButton pendingLabel="Creating…">Create draft</SubmitButton>
    </ActionForm>
  );
}
