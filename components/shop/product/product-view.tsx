"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Dots, useSnapCarousel } from "@/components/shop/use-snap-carousel";
import type { ShopColour, ShopSizeGuide } from "@/lib/shop/data";

export type ProductViewData = {
  name: string;
  price: string;
  description: string | null;
  isComingSoon: boolean;
  lowStock: number;
  typeName: string | null;
  collection: { name: string; slug: string } | null;
  images: { url: string; alt: string; colourId: string | null }[];
  colours: ShopColour[];
  variants: { id: string; sizeLabel: string | null; colourId: string | null; stock: number }[];
  sizeGuide: ShopSizeGuide | null;
};

export function ProductView({ product }: { product: ProductViewData }) {
  const hasColours = product.colours.length > 0;
  const inStock = (id: string) => product.variants.some((v) => v.colourId === id && v.stock > 0);
  // Start on the colour shown in the main photo (if matched), else the first colour in stock.
  const mainPhotoColour = product.images[0]?.colourId;
  const startColour = mainPhotoColour && inStock(mainPhotoColour) ? mainPhotoColour : product.colours.find((c) => inStock(c.id))?.id;
  const [colourId, setColourId] = useState<string | null>(startColour ?? product.colours[0]?.id ?? null);
  const sizes = [...new Set(product.variants.map((v) => v.sizeLabel ?? "One Size"))];
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const gallery = useSnapCarousel({ count: product.images.length, interval: 4000 });

  const variantFor = (sizeLabel: string, colour: string | null) =>
    product.variants.find((v) => (v.sizeLabel ?? "One Size") === sizeLabel && (!hasColours || v.colourId === colour));
  const selected = size ? variantFor(size, colourId) : undefined;
  const maxQuantity = Math.max(1, Math.min(selected?.stock ?? 1, 10));
  const colour = product.colours.find((c) => c.id === colourId) ?? null;

  function chooseColour(id: string) {
    setColourId(id);
    setQuantity(1);
    // Jump straight to the first photo of that colour.
    const target = product.images.findIndex((image) => image.colourId === id);
    if (target >= 0) gallery.goTo(target);
  }

  const stockMessage = product.isComingSoon
    ? "Coming soon — not available to buy yet."
    : !size
      ? "Choose a size."
      : !selected || selected.stock === 0
        ? "Sold out in this size."
        : selected.stock <= product.lowStock
          ? `Only ${selected.stock} left.`
          : "In stock.";

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      {/* Photos: swipe, or they move on by themselves */}
      <div className="relative -mx-4 sm:mx-0 lg:sticky lg:top-[calc(var(--header-total)+1.5rem)] lg:self-start">
        <div {...gallery.trackProps} className="no-scrollbar relative flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto bg-surface-2 sm:rounded-3xl">
          {product.images.length ? (
            product.images.map((image, index) => (
              <div key={image.url} className="relative h-full w-full shrink-0 snap-center">
                <Image src={image.url} alt={image.alt} fill priority={index === 0} sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
              </div>
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl uppercase text-ink-muted/30">LVN’LARGE</div>
          )}
        </div>
        {product.images.length > 1 && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-4 flex gap-1 sm:inset-x-6">
              {product.images.map((image, index) => (
                <span key={image.url} className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${index === gallery.index ? "bg-white" : "bg-white/35"}`} />
              ))}
            </div>
            <button type="button" aria-label="Previous photo" onClick={() => gallery.goTo(gallery.index - 1)} className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65 lg:flex">
              ←
            </button>
            <button type="button" aria-label="Next photo" onClick={() => gallery.goTo(gallery.index + 1)} className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65 lg:flex">
              →
            </button>
            <div className="mt-2">
              <Dots count={product.images.length} index={gallery.index} onSelect={gallery.goTo} label="Choose a photo" />
            </div>
          </>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-7 pt-6 lg:pt-2">
        <div className="animate-rise">
          <p className="flex flex-wrap gap-x-3 text-[11px] uppercase tracking-[0.3em] text-ink-muted">
            {product.collection ? (
              <Link href={`/collections/${product.collection.slug}`} className="hover:text-silver-strong">
                {product.collection.name}
              </Link>
            ) : (
              product.typeName && <span>{product.typeName}</span>
            )}
          </p>
          <h1 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-wide text-silver-strong sm:text-5xl">{product.name}</h1>
          <p className="mt-3 text-xl font-medium text-ink">{product.price}</p>
        </div>

        {hasColours && (
          <fieldset>
            <legend className="mb-3 text-[11px] uppercase tracking-[0.3em] text-ink-muted">
              Colour <span className="ml-2 normal-case tracking-normal text-ink">{colour?.name}</span>
            </legend>
            <div className="flex flex-wrap gap-1">
              {product.colours.map((c) => {
                const soldOut = !product.variants.some((v) => v.colourId === c.id && v.stock > 0);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => chooseColour(c.id)}
                    aria-label={`${c.name}${soldOut ? " (sold out)" : ""}`}
                    aria-pressed={c.id === colourId}
                    title={c.name}
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                  >
                    <span
                      className={`relative block h-8 w-8 rounded-full border transition-shadow ${c.id === colourId ? "border-transparent ring-2 ring-silver-strong ring-offset-[3px] ring-offset-bg" : "border-silver/40"} ${soldOut ? "opacity-50" : ""}`}
                      style={{ background: c.hex ?? "#777" }}
                    >
                      {soldOut && <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {!product.isComingSoon && sizes.length > 0 && (
          <fieldset>
            <div className="mb-3 flex items-center justify-between">
              <legend className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">Size</legend>
              <SizeGuideButton guide={product.sizeGuide} productName={product.name} />
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {sizes.map((label) => {
                const variant = variantFor(label, colourId);
                const available = Boolean(variant && variant.stock > 0);
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSize(label);
                      setQuantity(1);
                    }}
                    aria-pressed={size === label}
                    className="relative min-h-12 rounded-xl border border-line text-sm font-medium text-ink transition-colors hover:border-silver aria-pressed:border-silver-strong aria-pressed:bg-silver-strong aria-pressed:text-bg disabled:cursor-not-allowed disabled:text-ink-muted/50 disabled:line-through disabled:hover:border-line"
                  >
                    {label}
                    {!available && <span className="sr-only"> (sold out)</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <p role="status" className={`text-sm ${selected && selected.stock > 0 && selected.stock <= product.lowStock ? "text-army-glow" : "text-ink-muted"}`}>
          {stockMessage}
        </p>

        {!product.isComingSoon && (
          <div className="flex items-stretch gap-3">
            <div className="flex items-center rounded-full border border-line" role="group" aria-label="Quantity">
              <button type="button" aria-label="One less" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-14 w-12 text-xl text-ink disabled:opacity-30">
                −
              </button>
              <span className="w-8 text-center text-base tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button type="button" aria-label="One more" disabled={!selected || quantity >= maxQuantity} onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} className="h-14 w-12 text-xl text-ink disabled:opacity-30">
                +
              </button>
            </div>
            {/* The bag is built in step 4 (bag & payment). */}
            <button type="button" disabled className="min-h-14 flex-1 rounded-full bg-silver-strong text-xs font-semibold uppercase tracking-[0.28em] text-bg opacity-50">
              Add to bag
            </button>
          </div>
        )}
        {!product.isComingSoon && <p className="-mt-4 text-xs text-ink-muted">The bag opens in the next update.</p>}

        <div className="rounded-2xl border border-line p-4 text-sm leading-relaxed text-ink-muted">
          <span className="text-ink">Pickup only.</span> After you pay, LVN’LARGE contacts you to agree a pickup place and time.
        </div>

        {product.description && (
          <details open className="group border-t border-line pt-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-[0.3em] text-ink-muted">
              Details <span className="transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">{product.description}</p>
          </details>
        )}
      </div>
    </div>
  );
}

/** Size guide in a pop-up, without leaving the product page. */
function SizeGuideButton({ guide, productName }: { guide: ShopSizeGuide | null; productName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const rows = guide?.chart.rows ?? [];
  const hasValues = rows.some((row) => row.values.some((value) => value.trim()));

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="min-h-11 text-xs uppercase tracking-[0.2em] text-silver-strong underline underline-offset-4">
        Size guide
      </button>
      <dialog
        ref={dialog}
        aria-label="Size guide"
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
        className="m-auto mb-0 w-full max-w-lg rounded-t-3xl bg-bg p-0 text-ink backdrop:bg-black/60 sm:mb-auto sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-wide text-silver-strong">Size guide</h2>
            <p className="text-xs text-ink-muted">{guide?.name ?? productName}</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 px-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
            Close
          </button>
        </div>
        <div className="max-h-[70svh] overflow-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
          {guide && hasValues ? (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Size</th>
                    {guide.chart.columns.map((column) => (
                      <th key={column} className="py-2 pr-3 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.size} className="border-b border-line/60">
                      <th className="py-3 pr-3 font-semibold">{row.size}</th>
                      {row.values.map((value, i) => (
                        <td key={i} className="py-3 pr-3 tabular-nums">
                          {value || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-ink-muted">Measurements in {guide.unit}.</p>
              {guide.notes && <p className="mt-2 whitespace-pre-line text-xs text-ink-muted">{guide.notes}</p>}
            </>
          ) : (
            <p className="py-6 text-sm text-ink-muted">Measurements for this piece are coming soon. Message LVN’LARGE if you need help choosing a size.</p>
          )}
        </div>
      </dialog>
    </>
  );
}
