"use client";

import Image from "next/image";
import Link from "next/link";
import { Dots, useSnapCarousel } from "@/components/shop/use-snap-carousel";

export type CollectionSlide = { slug: string; name: string; image: string | null; count: number };

/** Cards fan out in 3D around the one in the middle, which is always the "front" card. */
function applyDepth(track: HTMLDivElement) {
  const centre = track.scrollLeft + track.clientWidth / 2;
  for (const slide of Array.from(track.children) as HTMLElement[]) {
    const card = slide.firstElementChild as HTMLElement | null;
    if (!card) continue;
    const offset = (slide.offsetLeft + slide.offsetWidth / 2 - centre) / slide.offsetWidth;
    const distance = Math.min(Math.abs(offset), 2);
    card.style.transform = `perspective(1100px) translateZ(${-distance * 90}px) rotateY(${Math.max(-1.5, Math.min(1.5, offset)) * 16}deg) scale(${1 - Math.min(distance, 1.2) * 0.1})`;
    card.style.opacity = String(1 - distance * 0.28);
    slide.style.zIndex = String(10 - Math.round(distance * 4));
  }
}

export function CollectionsCarousel({ slides }: { slides: CollectionSlide[] }) {
  // applyDepth is defined outside the component, so it never changes between renders.
  const { index, goTo, trackProps } = useSnapCarousel({ count: slides.length, interval: 5500, onFrame: applyDepth });

  return (
    <div>
      <div
        {...trackProps}
        className="no-scrollbar relative flex snap-x snap-mandatory overflow-x-auto px-[calc(50%-min(36vw,170px))] py-6 [scroll-padding-inline:0] sm:px-[calc(50%-190px)]"
      >
        {slides.map((slide, i) => (
          <div key={slide.slug} className="relative -mx-[5vw] w-[min(72vw,340px)] shrink-0 snap-center first:ml-0 last:mr-0 sm:-mx-6 sm:w-[380px] sm:first:ml-0 sm:last:mr-0">
            <Link
              href={`/collections/${slide.slug}`}
              className="block rounded-[1.6rem] border border-line bg-surface p-2.5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] transition-[transform,opacity] duration-150 will-change-transform"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] bg-surface-2">
                {slide.image ? (
                  <Image src={slide.image} alt="" fill sizes="(min-width: 640px) 380px, 72vw" priority={i === 0} className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center font-display text-4xl uppercase leading-none text-ink-muted/30">{slide.name}</div>
                )}
                <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3 px-2 pb-1.5 pt-3.5">
                <div className="min-w-0">
                  <p className="truncate font-display text-2xl uppercase leading-none tracking-wide text-ink">{slide.name}</p>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.25em] text-ink-muted">
                    {slide.count} {slide.count === 1 ? "piece" : "pieces"}
                  </p>
                </div>
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink">
                  →
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <Dots count={slides.length} index={index} onSelect={goTo} label="Choose a collection" />
    </div>
  );
}
