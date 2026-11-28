"use client";

import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { activeCount, shopHref, type FilterOptions, type Filters, type SortKey } from "@/lib/shop/filters";

const sortLabels: Record<SortKey, string> = { new: "Newest", "price-asc": "Price: low to high", "price-desc": "Price: high to low" };

/** Sticky bar with Filter (opens a sheet), sort, and removable filter chips. */
export function FilterBar({ filters, options, count }: { filters: Filters; options: FilterOptions; count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = activeCount(filters);

  const chips: { label: string; href: string }[] = [
    ...filters.collections.map((value) => ({
      label: options.collections.find((o) => o.value === value)?.label ?? value,
      href: shopHref({ ...filters, collections: filters.collections.filter((v) => v !== value) }),
    })),
    ...filters.types.map((value) => ({
      label: options.types.find((o) => o.value === value)?.label ?? value,
      href: shopHref({ ...filters, types: filters.types.filter((v) => v !== value) }),
    })),
    ...filters.sizes.map((value) => ({ label: `Size ${value}`, href: shopHref({ ...filters, sizes: filters.sizes.filter((v) => v !== value) }) })),
    ...filters.colours.map((value) => ({
      label: options.colours.find((o) => o.value === value)?.label ?? value,
      href: shopHref({ ...filters, colours: filters.colours.filter((v) => v !== value) }),
    })),
    ...(filters.min !== null ? [{ label: `From ₦${filters.min.toLocaleString("en-NG")}`, href: shopHref({ ...filters, min: null }) }] : []),
    ...(filters.max !== null ? [{ label: `Up to ₦${filters.max.toLocaleString("en-NG")}`, href: shopHref({ ...filters, max: null }) }] : []),
    ...(filters.inStock ? [{ label: "In stock", href: shopHref({ ...filters, inStock: false }) }] : []),
    ...(filters.isNew ? [{ label: "New in", href: shopHref({ ...filters, isNew: false }) }] : []),
    ...(filters.q ? [{ label: `“${filters.q}”`, href: shopHref({ ...filters, q: "" }) }] : []),
  ];

  return (
    <div className="sticky top-[var(--header-total)] z-30 -mx-4 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-lg sm:-mx-8 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-xs font-semibold uppercase tracking-[0.22em] text-silver-strong hover:border-silver"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
          Filter{active ? ` (${active})` : ""}
        </button>
        <span className="hidden text-xs uppercase tracking-[0.22em] text-ink-muted sm:block">
          {count} {count === 1 ? "piece" : "pieces"}
        </span>
        <label className="flex items-center gap-2">
          <span className="sr-only">Sort by</span>
          <select
            value={filters.sort}
            onChange={(event) => router.push(shopHref({ ...filters, sort: event.target.value as SortKey }), { scroll: false })}
            className="h-11 rounded-full border border-line bg-bg px-4 text-base text-ink sm:text-sm"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {chips.map((chip) => (
            <Link key={chip.href + chip.label} href={chip.href} scroll={false} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-3.5 text-xs text-ink">
              {chip.label}
              <span aria-hidden="true" className="text-ink-muted">
                ✕
              </span>
              <span className="sr-only">(remove)</span>
            </Link>
          ))}
          <Link href="/shop" scroll={false} className="inline-flex min-h-9 shrink-0 items-center px-2 text-xs uppercase tracking-[0.2em] text-ink-muted underline-offset-4 hover:underline">
            Clear all
          </Link>
        </div>
      )}

      {/* Rendered at the end of <body>: the blurred sticky bar would otherwise trap the full-screen panel inside it. */}
      {open && createPortal(<FilterSheet filters={filters} options={options} onClose={() => setOpen(false)} />, document.body)}
    </div>
  );
}

function FilterSheet({ filters, options, onClose }: { filters: Filters; options: FilterOptions; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Filters" className="fixed inset-0 z-[70] flex items-end bg-black/60 sm:items-stretch sm:justify-end" onClick={onClose}>
      <Form
        action="/shop"
        scroll={false}
        onSubmit={onClose}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88svh] w-full animate-sheet flex-col rounded-t-3xl bg-bg sm:max-h-none sm:max-w-md sm:rounded-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-2xl uppercase tracking-wide text-silver-strong">Filter</h2>
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
            Close
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          {filters.sort !== "new" && <input type="hidden" name="sort" value={filters.sort} />}

          <ChipGroup title="Availability">
            <Chip name="instock" value="1" label="In stock" defaultChecked={filters.inStock} />
            <Chip name="new" value="1" label="New in" defaultChecked={filters.isNew} />
          </ChipGroup>
          {options.collections.length > 0 && (
            <ChipGroup title="Collection">
              {options.collections.map((o) => (
                <Chip key={o.value} name="collection" value={o.value} label={o.label} defaultChecked={filters.collections.includes(o.value)} />
              ))}
            </ChipGroup>
          )}
          {options.types.length > 0 && (
            <ChipGroup title="Type">
              {options.types.map((o) => (
                <Chip key={o.value} name="type" value={o.value} label={o.label} defaultChecked={filters.types.includes(o.value)} />
              ))}
            </ChipGroup>
          )}
          {options.sizes.length > 0 && (
            <ChipGroup title="Size">
              {options.sizes.map((o) => (
                <Chip key={o.value} name="size" value={o.value} label={o.label} defaultChecked={filters.sizes.includes(o.value)} />
              ))}
            </ChipGroup>
          )}
          {options.colours.length > 0 && (
            <ChipGroup title="Colour">
              {options.colours.map((o) => (
                <Chip key={o.value} name="colour" value={o.value} label={o.label} hex={o.hex} defaultChecked={filters.colours.includes(o.value)} />
              ))}
            </ChipGroup>
          )}
          <fieldset>
            <legend className="mb-3 text-[11px] uppercase tracking-[0.3em] text-ink-muted">Price (₦)</legend>
            <div className="flex items-center gap-3">
              <input name="min" inputMode="numeric" placeholder="Min" defaultValue={filters.min ?? ""} aria-label="Minimum price in naira" className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink" />
              <span className="text-ink-muted">–</span>
              <input name="max" inputMode="numeric" placeholder="Max" defaultValue={filters.max ?? ""} aria-label="Maximum price in naira" className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink" />
            </div>
          </fieldset>
        </div>

        <div className="flex gap-3 border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <Link href="/shop" scroll={false} onClick={onClose} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line text-xs font-semibold uppercase tracking-[0.22em] text-silver-strong">
            Clear all
          </Link>
          <button type="submit" className="min-h-12 flex-[2] rounded-full bg-silver-strong text-xs font-semibold uppercase tracking-[0.22em] text-bg">
            Show results
          </button>
        </div>
      </Form>
    </div>
  );
}

function ChipGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] uppercase tracking-[0.3em] text-ink-muted">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ name, value, label, defaultChecked, hex }: { name: string; value: string; label: string; defaultChecked: boolean; hex?: string | null }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-ink transition-colors peer-checked:border-silver-strong peer-checked:bg-silver-strong peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-silver">
        {hex !== undefined && <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: hex ?? "#777" }} />}
        {label}
      </span>
    </label>
  );
}
