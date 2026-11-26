"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { compressImage } from "@/lib/image-compress";
import { CATALOGUE_BUCKET, catalogueImageUrl } from "@/lib/storage";
import type { ActionState } from "@/lib/admin/action-state";
import { FormMessage } from "./forms";
import { buttonClass } from "./ui";

/** Upload or replace a single cover photo (e.g. a collection cover). */
export function CoverUploader({
  folder,
  currentPath,
  alt,
  onUploaded,
  onRemove,
}: {
  folder: string; // e.g. "collections/<id>"
  currentPath: string | null;
  alt: string;
  onUploaded: (path: string) => Promise<ActionState>;
  onRemove: () => Promise<ActionState>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ActionState>({ ok: false, message: null });
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = pending || progress !== null;

  async function upload(file: File) {
    setState({ ok: false, message: null });
    try {
      setProgress("Preparing photo…");
      const blob = await compressImage(file);
      setProgress("Uploading…");
      const path = `${folder}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient()
        .storage.from(CATALOGUE_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
      if (error) throw new Error("Upload failed. Check your connection and try again.");
      setProgress("Saving…");
      setState(await onUploaded(path));
    } catch (error) {
      setState({ ok: false, message: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl border border-line bg-surface-2">
        {currentPath ? (
          <Image src={catalogueImageUrl(currentPath)} alt={alt} fill sizes="320px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-ink-muted">No cover photo yet</span>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Choose cover photo"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file).finally(() => (event.target.value = ""));
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={buttonClass.secondary}>
          {progress ?? (currentPath ? "Replace cover" : "+ Add cover photo")}
        </button>
        {currentPath && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Remove the cover photo?")) startTransition(async () => setState(await onRemove()));
            }}
            className={buttonClass.danger}
          >
            Remove
          </button>
        )}
      </div>
      <FormMessage state={state} />
    </div>
  );
}
