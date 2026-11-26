"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { compressImage } from "@/lib/image-compress";
import { CATALOGUE_BUCKET, catalogueImageUrl } from "@/lib/storage";
import type { ActionState } from "@/lib/admin/action-state";
import { FormMessage } from "@/components/admin/forms";
import { ArrowDown, ArrowUp, buttonClass, inputClass } from "@/components/admin/ui";
import { deleteImage, moveImage, recordProductImages, setImageColour } from "../actions";

type Photo = { id: string; storage_path: string; colour_id: string | null };
type Colour = { id: string; name: string };

export function PhotoManager({
  productId,
  productName,
  photos,
  colours,
}: {
  productId: string;
  productName: string;
  photos: Photo[];
  colours: Colour[];
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ActionState>({ ok: false, message: null });
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(files: FileList) {
    const supabase = createClient();
    const uploaded: string[] = [];
    setState({ ok: false, message: null });

    try {
      for (const [index, file] of [...files].entries()) {
        setProgress(`Preparing photo ${index + 1} of ${files.length}…`);
        const blob = await compressImage(file);
        setProgress(`Uploading photo ${index + 1} of ${files.length}…`);
        const path = `products/${productId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from(CATALOGUE_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw new Error("Upload failed. Check your connection and try again.");
        uploaded.push(path);
      }
    } catch (error) {
      setProgress(null);
      // Keep any photos that did upload before the failure.
      if (uploaded.length) await recordProductImages(productId, uploaded);
      setState({ ok: false, message: error instanceof Error ? error.message : "Upload failed." });
      return;
    }

    setProgress("Saving…");
    const result = await recordProductImages(productId, uploaded);
    setProgress(null);
    setState(result);
  }

  function run(action: () => Promise<ActionState>) {
    startTransition(async () => setState(await action()));
  }

  const busy = pending || progress !== null;

  return (
    <div className="flex flex-col gap-4">
      {photos.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3">
              <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-bg">
                <Image
                  src={catalogueImageUrl(photo.storage_path)}
                  alt={`${productName} photo ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-army/90 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider text-on-army">
                    Main
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                {colours.length > 0 ? (
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Shows colour</span>
                    <select
                      className={inputClass}
                      value={photo.colour_id ?? ""}
                      disabled={busy}
                      onChange={(event) => run(() => setImageColour(photo.id, event.target.value || null))}
                    >
                      <option value="">All colours</option>
                      {colours.map((colour) => (
                        <option key={colour.id} value={colour.id}>
                          {colour.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className="text-xs text-ink-muted">Photo {index + 1}</span>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Move photo earlier"
                    disabled={busy || index === 0}
                    onClick={() => run(() => moveImage(photo.id, -1))}
                    className={buttonClass.icon}
                  >
                    <ArrowUp />
                  </button>
                  <button
                    type="button"
                    aria-label="Move photo later"
                    disabled={busy || index === photos.length - 1}
                    onClick={() => run(() => moveImage(photo.id, 1))}
                    className={buttonClass.icon}
                  >
                    <ArrowDown />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Remove this photo?")) run(() => deleteImage(photo.id));
                    }}
                    className={`${buttonClass.danger} ml-auto px-3`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label="Choose photos"
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) void upload(files).finally(() => (event.target.value = ""));
        }}
      />
      <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className={buttonClass.secondary}>
        {progress ?? "+ Add photos"}
      </button>
      <p className="text-xs text-ink-muted">
        Take a photo or pick from your library. Photos are shrunk to 2000px wide automatically. The first photo is the
        main one.
      </p>
      <FormMessage state={state} />
    </div>
  );
}
