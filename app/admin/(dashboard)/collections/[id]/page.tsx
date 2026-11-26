import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Collection, ProductStatus } from "@/lib/admin/catalogue";
import { ActionButton } from "@/components/admin/action-buttons";
import { CoverUploader } from "@/components/admin/cover-uploader";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import {
  ArrowDown,
  ArrowUp,
  EmptyState,
  Field,
  PageHeader,
  Section,
  StatusBadge,
  Toggle,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  addProductToCollection,
  deleteCollection,
  moveProductInCollection,
  removeCollectionCover,
  removeProductFromCollection,
  setCollectionCover,
  updateCollection,
} from "../actions";

export const metadata = { title: "Edit collection" };

export default function EditCollectionPage({ params }: PageProps<"/admin/collections/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading collection…</p>}>
      <CollectionEditor params={params} />
    </Suspense>
  );
}

type Member = {
  product_id: string;
  sort_order: number;
  products: { id: string; name: string; status: ProductStatus } | null;
};

async function CollectionEditor({ params }: { params: PageProps<"/admin/collections/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: collection } = await supabase.from("collections").select("*").eq("id", id).maybeSingle<Collection>();
  if (!collection) notFound();

  const [{ data: memberData }, { data: allProducts }] = await Promise.all([
    supabase
      .from("collection_products")
      .select("product_id, sort_order, products(id, name, status)")
      .eq("collection_id", id)
      .order("sort_order"),
    supabase.from("products").select("id, name").neq("status", "archived").order("name"),
  ]);
  const members = ((memberData ?? []) as unknown as Member[]).filter((member) => member.products);
  const memberIds = new Set(members.map((member) => member.product_id));
  const addable = (allProducts ?? []).filter((product) => !memberIds.has(product.id));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={collection.name} back={{ href: "/admin/collections", label: "Collections" }} />
      <div className="flex flex-col gap-4">
        <Section title="Details">
          <ActionForm action={updateCollection.bind(null, collection.id)}>
            <Field label="Name">
              <input name="name" required maxLength={120} defaultValue={collection.name} className={inputClass} />
            </Field>
            <Field label="Description" hint="Shown on the collection page.">
              <textarea name="description" maxLength={3000} defaultValue={collection.description ?? ""} className={textareaClass} />
            </Field>
            <div className="divide-y divide-line border-y border-line">
              <Toggle name="is_published" label="Published" hint="Visible to shoppers." defaultChecked={collection.is_published} />
              <Toggle name="is_featured" label="Featured" hint="Highlighted on the home page." defaultChecked={collection.is_featured} />
            </div>
            <SubmitButton>Save collection</SubmitButton>
          </ActionForm>
        </Section>

        <Section title="Cover photo">
          <CoverUploader
            folder={`collections/${collection.id}`}
            currentPath={collection.cover_image_path}
            alt={`${collection.name} cover`}
            onUploaded={setCollectionCover.bind(null, collection.id)}
            onRemove={removeCollectionCover.bind(null, collection.id)}
          />
        </Section>

        <Section title="Products" description="Order here is the order shoppers see in this collection.">
          {members.length === 0 ? (
            <EmptyState>No products in this collection yet.</EmptyState>
          ) : (
            <ol className="divide-y divide-line border-y border-line">
              {members.map((member, index) => (
                <li key={member.product_id} className="flex items-center gap-2 py-2">
                  <Link href={`/admin/products/${member.product_id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-base text-ink">{member.products!.name}</span>
                    <StatusBadge status={member.products!.status} />
                  </Link>
                  <ActionButton
                    action={moveProductInCollection.bind(null, collection.id, member.product_id, -1)}
                    label="Move up"
                    disabled={index === 0}
                  >
                    <ArrowUp />
                  </ActionButton>
                  <ActionButton
                    action={moveProductInCollection.bind(null, collection.id, member.product_id, 1)}
                    label="Move down"
                    disabled={index === members.length - 1}
                  >
                    <ArrowDown />
                  </ActionButton>
                  <ActionButton
                    action={removeProductFromCollection.bind(null, collection.id, member.product_id)}
                    label={`Remove ${member.products!.name}`}
                    confirmText={`Remove “${member.products!.name}” from ${collection.name}?`}
                  >
                    ✕
                  </ActionButton>
                </li>
              ))}
            </ol>
          )}

          {addable.length > 0 && (
            <ActionForm action={addProductToCollection.bind(null, collection.id)} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select name="product_id" defaultValue="" aria-label="Product to add" className={inputClass}>
                <option value="" disabled>
                  Add a product…
                </option>
                {addable.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <SubmitButton pendingLabel="Adding…" className="shrink-0">
                Add
              </SubmitButton>
            </ActionForm>
          )}
        </Section>

        <Section title="Delete">
          <ActionForm action={deleteCollection.bind(null, collection.id)}>
            <p className="text-sm text-ink-muted">Deleting a collection doesn&apos;t delete its products.</p>
            <ConfirmButton confirmText={`Delete the collection “${collection.name}”? This can't be undone.`}>
              Delete collection
            </ConfirmButton>
          </ActionForm>
        </Section>
      </div>
    </div>
  );
}
