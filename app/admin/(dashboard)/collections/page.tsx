import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { catalogueImageUrl } from "@/lib/storage";
import type { Collection } from "@/lib/admin/catalogue";
import { ActionButton } from "@/components/admin/action-buttons";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { ArrowDown, ArrowUp, Badge, EmptyState, PageHeader, Section, inputClass } from "@/components/admin/ui";
import { createCollection, moveCollection } from "./actions";

export const metadata = { title: "Collections" };

export default function CollectionsPage() {
  return (
    <>
      <PageHeader title="Collections" description="Order here is the order shoppers see." />
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading collections…</p>}>
        <CollectionList />
      </Suspense>
      <div className="mt-6">
        <Section title="New collection">
          <ActionForm action={createCollection} className="flex flex-col gap-3 sm:flex-row">
            <input name="name" required maxLength={120} placeholder="Collection name" aria-label="Collection name" className={inputClass} />
            <SubmitButton pendingLabel="Creating…" className="shrink-0">
              Create
            </SubmitButton>
          </ActionForm>
        </Section>
      </div>
    </>
  );
}

async function CollectionList() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select("*, collection_products(count)")
    .order("sort_order")
    .order("name");
  const collections = (data ?? []) as (Collection & { collection_products: { count: number }[] })[];

  if (collections.length === 0) return <EmptyState>No collections yet.</EmptyState>;

  return (
    <ol className="flex flex-col gap-3">
      {collections.map((collection, index) => (
        <li key={collection.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
          <Link href={`/admin/collections/${collection.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              {collection.cover_image_path && (
                <Image src={catalogueImageUrl(collection.cover_image_path)} alt="" fill sizes="56px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-ink">{collection.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {collection.is_published ? <Badge tone="good">Published</Badge> : <Badge>Hidden</Badge>}
                {collection.is_featured && <Badge>Featured</Badge>}
                <Badge>{collection.collection_products[0]?.count ?? 0} products</Badge>
              </div>
            </div>
          </Link>
          <div className="flex shrink-0 gap-1">
            <ActionButton action={moveCollection.bind(null, collection.id, -1)} label={`Move ${collection.name} up`} disabled={index === 0}>
              <ArrowUp />
            </ActionButton>
            <ActionButton
              action={moveCollection.bind(null, collection.id, 1)}
              label={`Move ${collection.name} down`}
              disabled={index === collections.length - 1}
            >
              <ArrowDown />
            </ActionButton>
          </div>
        </li>
      ))}
    </ol>
  );
}
