import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { koboToNairaInput } from "@/lib/format";
import {
  stockLevel,
  type Colour,
  type Product,
  type ProductImage,
  type Size,
  type Variant,
} from "@/lib/admin/catalogue";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import {
  Badge,
  Field,
  PageHeader,
  Section,
  StatusBadge,
  Toggle,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  deleteProduct,
  saveProductOptions,
  saveStock,
  setProductCollections,
  setProductStatus,
  updateProductDetails,
} from "../actions";
import { OptionsEditor } from "./options-editor";
import { PhotoManager } from "./photo-manager";

export const metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading product…</p>}>
      <ProductEditor params={params} />
    </Suspense>
  );
}

const sections = [
  { id: "details", label: "Details" },
  { id: "photos", label: "Photos" },
  { id: "options", label: "Sizes & colours" },
  { id: "stock", label: "Stock" },
  { id: "collections", label: "Collections" },
  { id: "visibility", label: "Publish" },
];

async function ProductEditor({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).maybeSingle<Product>();
  if (!product) notFound();

  const [types, sizes, guides, collections, memberships, colours, variants, images] = await Promise.all([
    supabase.from("product_types").select("id, name").order("sort_order"),
    supabase.from("sizes").select("id, label, sort_order").order("sort_order"),
    supabase.from("size_guides").select("id, name").order("name"),
    supabase.from("collections").select("id, name, is_published").order("sort_order"),
    supabase.from("collection_products").select("collection_id").eq("product_id", id),
    supabase.from("product_colours").select("*").eq("product_id", id).order("sort_order"),
    supabase.from("product_variants").select("*").eq("product_id", id),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order").order("created_at"),
  ]);

  const sizeList = (sizes.data ?? []) as Size[];
  const colourList = (colours.data ?? []) as Colour[];
  const variantList = ((variants.data ?? []) as Variant[]).filter((variant) => variant.is_active);
  const imageList = (images.data ?? []) as ProductImage[];
  const memberIds = new Set((memberships.data ?? []).map((row) => row.collection_id as string));
  const selectedSizeIds = [...new Set(variantList.map((variant) => variant.size_id).filter(Boolean))] as string[];

  const sizeLabel = new Map(sizeList.map((size) => [size.id, size.label]));
  const sizeOrder = new Map(sizeList.map((size) => [size.id, size.sort_order]));
  const colourGroups: { colour: Colour | null; variants: Variant[] }[] = (colourList.length ? colourList : [null]).map(
    (colour) => ({
      colour,
      variants: variantList
        .filter((variant) => variant.colour_id === (colour?.id ?? null))
        .sort((a, b) => (sizeOrder.get(a.size_id ?? "") ?? 0) - (sizeOrder.get(b.size_id ?? "") ?? 0)),
    }),
  );
  const totalStock = variantList.reduce((sum, variant) => sum + variant.stock_quantity, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={product.name} back={{ href: "/admin/products", label: "Products" }} />
      <div className="-mt-3 mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={product.status} />
        {product.is_coming_soon && <Badge>Coming soon</Badge>}
        <Badge>{totalStock} in stock</Badge>
      </div>

      <nav aria-label="Sections" className="sticky top-16 z-20 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-bg/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="flex min-h-10 shrink-0 items-center rounded-full border border-line px-4 text-sm text-ink-muted hover:text-silver-strong"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-4">
        <Section id="details" title="Details">
          <ActionForm action={updateProductDetails.bind(null, product.id)}>
            <Field label="Product name">
              <input name="name" required maxLength={160} defaultValue={product.name} className={inputClass} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Type">
                <select name="product_type_id" defaultValue={product.product_type_id} className={inputClass}>
                  {(types.data ?? []).map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Price (₦)">
                <input
                  name="price"
                  required
                  inputMode="decimal"
                  defaultValue={koboToNairaInput(product.price_kobo)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea name="description" maxLength={5000} defaultValue={product.description ?? ""} className={textareaClass} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Size guide" hint="Create guides under More → Size guides.">
                <select name="size_guide_id" defaultValue={product.size_guide_id ?? ""} className={inputClass}>
                  <option value="">None</option>
                  {(guides.data ?? []).map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Low-stock warning at" hint="Warn when a size/colour has this many or fewer left.">
                <input
                  name="low_stock_threshold"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1000}
                  defaultValue={product.low_stock_threshold}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="divide-y divide-line border-y border-line">
              <Toggle name="is_featured" label="Featured" hint="Show in featured spots on the home page." defaultChecked={product.is_featured} />
              <Toggle name="is_new_arrival" label="New arrival" defaultChecked={product.is_new_arrival} />
              <Toggle
                name="is_coming_soon"
                label="Coming soon"
                hint="Shown in the shop but can't be bought."
                defaultChecked={product.is_coming_soon}
              />
              <Toggle
                name="allow_preorder"
                label="Allow preorder"
                hint="Customers can order sold-out sizes. Never switched on automatically."
                defaultChecked={product.allow_preorder}
              />
            </div>
            <SubmitButton>Save details</SubmitButton>
          </ActionForm>
        </Section>

        <Section id="photos" title="Photos">
          <PhotoManager
            productId={product.id}
            productName={product.name}
            photos={imageList.map(({ id, storage_path, colour_id }) => ({ id, storage_path, colour_id }))}
            colours={colourList.map(({ id, name }) => ({ id, name }))}
          />
        </Section>

        <Section id="options" title="Sizes & colours" description="Each size + colour gets its own stock count.">
          <OptionsEditor
            action={saveProductOptions.bind(null, product.id)}
            sizes={sizeList.map(({ id, label }) => ({ id, label }))}
            selectedSizeIds={selectedSizeIds}
            initialColours={colourList.map(({ id, name, hex }) => ({ id, name, hex }))}
          />
        </Section>

        <Section id="stock" title="Stock" description="How many you have of each. Every change is recorded.">
          {variantList.length === 0 ? (
            <p className="text-sm text-ink-muted">Save sizes first, then enter stock here.</p>
          ) : (
            <ActionForm action={saveStock.bind(null, product.id)}>
              {colourGroups.map(({ colour, variants: group }) => (
                <fieldset key={colour?.id ?? "none"}>
                  {colour && (
                    <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border border-line"
                        style={{ background: colour.hex ?? "transparent" }}
                      />
                      {colour.name}
                    </legend>
                  )}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {group.map((variant) => {
                      const level = stockLevel(variant);
                      return (
                        <label
                          key={variant.id}
                          className={`flex items-center gap-2 rounded-lg border p-2 ${
                            level === "out" ? "border-danger/50" : level === "low" ? "border-amber-500/50" : "border-line"
                          }`}
                        >
                          <span className="w-16 shrink-0 text-center text-sm font-semibold text-ink">
                            {sizeLabel.get(variant.size_id ?? "") ?? "—"}
                          </span>
                          <input
                            name={`stock:${variant.id}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={100000}
                            defaultValue={variant.stock_quantity}
                            aria-label={`Stock for ${sizeLabel.get(variant.size_id ?? "") ?? ""} ${colour?.name ?? ""}`}
                            className={`${inputClass} px-2 text-center`}
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              <p className="text-xs text-ink-muted">
                <span className="text-amber-500">Amber</span> = low stock · <span className="text-danger">Red</span> = sold out
              </p>
              <SubmitButton>Save stock</SubmitButton>
            </ActionForm>
          )}
        </Section>

        <Section id="collections" title="Collections" description="A product can be in more than one collection.">
          <ActionForm action={setProductCollections.bind(null, product.id)}>
            <div className="divide-y divide-line border-y border-line">
              {(collections.data ?? []).map((collection) => (
                <label key={collection.id} className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    name="collections"
                    value={collection.id}
                    defaultChecked={memberIds.has(collection.id)}
                    className="h-6 w-6 accent-[var(--army)]"
                  />
                  <span className="flex-1 text-base text-ink">{collection.name}</span>
                  {!collection.is_published && <Badge>Hidden</Badge>}
                </label>
              ))}
            </div>
            <SubmitButton>Save collections</SubmitButton>
          </ActionForm>
        </Section>

        <Section id="visibility" title="Publish">
          <p className="mb-4 text-sm text-ink-muted">
            To publish, a product needs a price, at least one photo and at least one size (unless it&apos;s Coming soon).
          </p>
          <div className="flex flex-col gap-3">
            {product.status !== "published" && (
              <ActionForm action={setProductStatus.bind(null, product.id, "published")} className="flex flex-col gap-2">
                <SubmitButton pendingLabel="Publishing…">Publish to shop</SubmitButton>
              </ActionForm>
            )}
            {product.status !== "draft" && (
              <ActionForm action={setProductStatus.bind(null, product.id, "draft")} className="flex flex-col gap-2">
                <SubmitButton variant="secondary">{product.status === "published" ? "Unpublish (back to draft)" : "Restore as draft"}</SubmitButton>
              </ActionForm>
            )}
            {product.status !== "archived" && (
              <ActionForm action={setProductStatus.bind(null, product.id, "archived")} className="flex flex-col gap-2">
                <SubmitButton variant="secondary">Archive</SubmitButton>
              </ActionForm>
            )}
            <ActionForm action={deleteProduct.bind(null, product.id)} className="flex flex-col gap-2">
              <ConfirmButton confirmText={`Delete “${product.name}” for good? This can't be undone.`}>
                Delete product
              </ConfirmButton>
              <p className="text-xs text-ink-muted">Products that have been ordered can only be archived.</p>
            </ActionForm>
          </div>
        </Section>
      </div>
    </div>
  );
}
