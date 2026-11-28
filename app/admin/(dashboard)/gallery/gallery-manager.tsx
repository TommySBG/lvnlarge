"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { compressImage } from "@/lib/image-compress";
import { CATALOGUE_BUCKET, catalogueImageUrl } from "@/lib/storage";
import type { ActionState } from "@/lib/admin/action-state";
import { ActionForm, FormMessage, SubmitButton } from "@/components/admin/forms";
import { ArrowDown, ArrowUp, EmptyState, Field, Toggle, buttonClass, inputClass } from "@/components/admin/ui";
import { deleteGalleryImage, moveGalleryImage, recordGalleryImages, updateGalleryImage } from "./actions";

export type GalleryRow = {
  id: string;
  storage_path: string;
  caption: string | null;
  kind: "founder" | "model" | "customer" | "campaign" | "editorial" | "concept";
  product_id: string | null;
  is_published: boolean;
};

const kindOptions: { value: GalleryRow["kind"]; label: string }[] = [
  { value: "founder", label: "Founder" },
  { value: "model", label: "Model" },
  { value: "customer", label: "Customer" },
  { value: "campaign", label: "Campaign" },
  { value: "editorial", label: "Editorial" },
  { value: "concept", label: "Concept / AI artwork (labelled on the site)" },
];

export function GalleryManager({ photos, products }: { photos: GalleryRow[]; products: { id: string; name: string }[] }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ActionState>({ ok: false, message: null });
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = pending || progress !== null;

  async function upload(files: FileList) {
    const supabase = createClient();
    const uploaded: string[] = [];
    setState({ ok: false, message: null });
    try {
      for (const [index, file] of [...files].slice(0, 30).entries()) {
        setProgress(`Preparing photo ${index + 1} of ${files.length}…`);
        const blob = await compressImage(file);
        setProgress(`Uploading photo ${index + 1} of ${files.length}…`);
        const path = `gallery/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from(CATALOGUE_BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw new Error("Upload failed. Check your connection and try again.");
        uploaded.push(path);
      }
    } catch (error) {
      setProgress(null);
      if (uploaded.length) await recordGalleryImages(uploaded);
      setState({ ok: false, message: error instanceof Error ? error.message : "Upload failed." });
      return;
    }
    setProgress("Saving…");
    const result = await recordGalleryImages(uploaded);
    setProgress(null);
    setState(result);
  }

  function run(action: () => Promise<ActionState>) {
    startTransition(async () => setState(await action()));
  }

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) void upload(event.target.files);
          event.target.value = "";
        }}
      />
      <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className={`${buttonClass.primary} w-full`}>
        {progress ?? "Add photos"}
      </button>
      <p className="-mt-2 text-xs text-ink-muted">Take a photo or choose from your library. Photos are shrunk to 2000px wide before uploading.</p>
      <FormMessage state={state} />

      {photos.length === 0 ? (
        <EmptyState>No gallery photos yet. Until you add some, the site shows your welcome photo.</EmptyState>
      ) : (
        <ol className="flex flex-col gap-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex gap-3">
                <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-lg bg-bg">
                  <Image src={catalogueImageUrl(photo.storage_path)} alt={photo.caption ?? `Gallery photo ${index + 1}`} fill sizes="112px" className="object-cover" />
                  {!photo.is_published && <span className="absolute inset-x-0 bottom-0 bg-black/75 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white">Hidden</span>}
                </div>
                <div className="flex flex-1 flex-col justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">Photo {index + 1}</span>
                  <div className="flex gap-2">
                    <button type="button" aria-label="Move photo earlier" disabled={busy || index === 0} onClick={() => run(() => moveGalleryImage(photo.id, -1))} className={buttonClass.icon}>
                      <ArrowUp />
                    </button>
                    <button type="button" aria-label="Move photo later" disabled={busy || index === photos.length - 1} onClick={() => run(() => moveGalleryImage(photo.id, 1))} className={buttonClass.icon}>
                      <ArrowDown />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => window.confirm("Remove this photo from the gallery?") && run(() => deleteGalleryImage(photo.id))}
                      className={`${buttonClass.danger} ml-auto px-3`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <details className="mt-3 border-t border-line pt-3">
                <summary className="cursor-pointer py-1 text-sm text-silver-strong">Caption, type &amp; product link</summary>
                <ActionForm action={updateGalleryImage.bind(null, photo.id)} className="mt-3 flex flex-col gap-4">
                  <Field label="Caption (optional)">
                    <input name="caption" defaultValue={photo.caption ?? ""} maxLength={200} className={inputClass} />
                  </Field>
                  <Field label="Type of photo" hint="Concept/AI photos are always labelled “Concept” so they’re never mistaken for the real product.">
                    <select name="kind" defaultValue={photo.kind} className={inputClass}>
                      {kindOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Shop the look (optional)" hint="Links the photo to the product being worn. Only shows if that product is live.">
                    <select name="product_id" defaultValue={photo.product_id ?? ""} className={inputClass}>
                      <option value="">No product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Toggle name="is_published" label="Show on the site" defaultChecked={photo.is_published} />
                  <SubmitButton>Save</SubmitButton>
                </ActionForm>
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
