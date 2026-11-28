"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { CardData } from "@/lib/shop/card";

/**
 * Shop All style card: swipe the photo to see each colour, or tap a colour
 * dot to jump to it. Tapping the photo or name opens the product page.
 */
export function ProductCard({ card, priority = false, sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" }: { card: CardData; priority?: boolean; sizes?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const href = `/product/${card.slug}`;

  function onScroll() {
    const el = track.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function jump(index: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActive(index);
  }

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-surface-2">
        <Link href={href} aria-label={card.name} className="block" tabIndex={-1}>
          <div ref={track} onScroll={onScroll} className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
            {card.slides.map((slide, index) => (
              <div key={index} className="relative h-full w-full shrink-0 snap-center">
                {slide.url ? (
                  <Image
                    src={slide.url}
                    alt={slide.alt}
                    fill
                    sizes={sizes}
                    priority={priority && index === 0}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-2xl uppercase text-ink-muted/40">LVN’LARGE</div>
                )}
              </div>
            ))}
          </div>
        </Link>
        {card.badge && (
          <span
            className={`pointer-events-none absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur ${
              card.badge === "Sold out" ? "bg-black/70 text-white/90" : card.badge === "New" ? "bg-army text-on-army" : "bg-white/85 text-black"
            }`}
          >
            {card.badge}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 px-1 pt-3">
        <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug text-ink hover:text-silver-strong">
          {card.name}
        </Link>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-army px-2 py-1 text-xs font-semibold tracking-wide text-on-army">{card.price}</span>
          {card.colours.length > 0 &&
            (card.colourLinked ? (
              <div className="flex items-center gap-1" role="group" aria-label="Colours">
                {card.slides.map((slide, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => jump(index)}
                    aria-label={`Show ${slide.colour ?? "colour"}`}
                    aria-pressed={active === index}
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                  >
                    <Swatch hex={slide.hex} selected={active === index} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5" aria-label={`Colours: ${card.colours.map((c) => c.name).join(", ")}`}>
                {card.colours.slice(0, 5).map((colour) => (
                  <Swatch key={colour.name} hex={colour.hex} selected={false} />
                ))}
              </div>
            ))}
        </div>
      </div>
    </article>
  );
}

function Swatch({ hex, selected }: { hex: string | null; selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-4 w-4 rounded-full border transition-shadow ${selected ? "border-transparent ring-2 ring-silver ring-offset-2 ring-offset-bg" : "border-silver/40"}`}
      style={{ background: hex ?? "#777" }}
    />
  );
}

export function ProductGrid({ cards, priorityCount = 4 }: { cards: CardData[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {cards.map((card, index) => (
        <li key={card.slug}>
          <ProductCard card={card} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
