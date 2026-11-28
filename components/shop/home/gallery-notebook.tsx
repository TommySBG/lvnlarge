"use client";

import Image from "next/image";
import { Dots, useSnapCarousel } from "@/components/shop/use-snap-carousel";

export type NotebookPhoto = { id: string; url: string; caption: string | null; concept: boolean };

const tilt = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];

/** A lookbook "notebook": pages of four clipped photos you swipe through. */
export function GalleryNotebook({ photos }: { photos: NotebookPhoto[] }) {
  const pages: (NotebookPhoto | null)[][] = [];
  for (let i = 0; i < Math.max(photos.length, 1); i += 4) {
    const page: (NotebookPhoto | null)[] = photos.slice(i, i + 4);
    while (page.length < 4) page.push(null);
    pages.push(page);
  }
  const { index, goTo, trackProps } = useSnapCarousel({ count: pages.length, interval: 6500 });

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* Paper stack behind the open page */}
      <div aria-hidden="true" className="absolute inset-x-3 -bottom-2 top-3 rotate-1 rounded-[1.4rem] bg-[#d9d6ce]" />
      <div className="relative overflow-hidden rounded-[1.4rem] bg-[#ecebe6] text-neutral-900 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] [background-image:radial-gradient(rgba(0,0,0,0.09)_1px,transparent_1px)] [background-size:18px_18px]">
        {/* Binding holes */}
        <div aria-hidden="true" className="flex justify-center gap-5 pt-3">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-neutral-900/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" />
          ))}
        </div>
        <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500 sm:px-8">
          <span>LVN Gallery — Lookbook</span>
          <span>
            Page {String(index + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}
          </span>
        </div>

        <div {...trackProps} className="no-scrollbar relative flex snap-x snap-mandatory overflow-x-auto">
          {pages.map((page, p) => (
            <div key={p} className="grid w-full shrink-0 snap-center grid-cols-2 gap-x-4 gap-y-7 px-5 pb-6 pt-7 sm:gap-x-8 sm:px-10 sm:pb-10">
              {page.map((photo, i) => (
                <figure key={photo?.id ?? `empty-${i}`} className={`relative ${tilt[i]}`}>
                  <PaperClip />
                  <div className="bg-white p-1.5 pb-6 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)] sm:p-2.5 sm:pb-9">
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200">
                      {photo ? (
                        <Image src={photo.url} alt={photo.caption ?? "LVN’LARGE lookbook photo"} fill sizes="(min-width: 768px) 340px, 45vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                          More photos
                          <br />
                          soon
                        </div>
                      )}
                      {photo?.concept && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white">Concept</span>
                      )}
                    </div>
                  </div>
                  {photo?.caption && (
                    <figcaption className="absolute inset-x-2 bottom-1 truncate text-center text-[10px] uppercase tracking-[0.15em] text-neutral-600 sm:bottom-2.5 sm:text-xs">
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          ))}
        </div>
        <div className="pb-3">
          <Dots count={pages.length} index={index} onSelect={goTo} label="Choose a page" tone="dark" />
        </div>
      </div>
    </div>
  );
}

function PaperClip() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 60" className="absolute -top-5 right-5 z-10 h-12 w-5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]" fill="none">
      <defs>
        <linearGradient id="clip-silver" x1="0" x2="1">
          <stop offset="0" stopColor="#8e9196" />
          <stop offset="0.5" stopColor="#f2f3f5" />
          <stop offset="1" stopColor="#7f8287" />
        </linearGradient>
      </defs>
      <path d="M8 40V12a4 4 0 018 0v34a7 7 0 01-14 0V16" stroke="url(#clip-silver)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
