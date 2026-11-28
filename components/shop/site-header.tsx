"use client";

import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { useEffect, useRef, useState } from "react";
import logo from "@/public/brand/logo.png";
import { ThemeToggle } from "@/components/theme-toggle";
import { shopLinks } from "@/lib/shop/links";

/**
 * Sticky site header. Over the home page's welcome photo it is transparent
 * (see .site-header rules in globals.css); everywhere else it is solid.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
          {/* Left: menu button (phone) / logo (desktop) */}
          <div className="flex items-center lg:hidden">
            <IconButton label="Open menu" onClick={() => setMenuOpen(true)}>
              <path d="M4 8h16M4 16h16" />
            </IconButton>
          </div>
          <Link href="/" aria-label="LVN’LARGE home" className="flex items-center gap-2 justify-self-center lg:justify-self-start">
            <Image src={logo} alt="" priority className="h-9 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" />
            <span className="hidden font-display text-xl uppercase tracking-[0.12em] sm:inline">LVN’LARGE</span>
          </Link>

          <nav aria-label="Main" className="hidden justify-center gap-1 lg:flex">
            {shopLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-[13px] font-medium uppercase tracking-[0.18em] opacity-80 transition-opacity hover:opacity-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: search, theme, bag */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <IconButton label="Search" onClick={() => setSearchOpen(true)}>
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4.2-4.2" />
            </IconButton>
            <ThemeToggle className="hidden border-transparent text-current hover:border-transparent hover:text-current sm:inline-flex" />
            {/* The bag is built in step 4 (bag & payment). */}
            <button
              type="button"
              disabled
              title="Your bag opens soon"
              aria-label="Bag (opens soon)"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full opacity-60"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V7a3 3 0 016 0v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

/** Closes on Escape and stops the page behind from scrolling. */
function useOverlay(onClose: () => void) {
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
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  useOverlay(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60] flex animate-fade flex-col bg-bg/97 pt-[env(safe-area-inset-top)] backdrop-blur-xl [animation-duration:0.3s]">
      <div className="flex h-16 items-center justify-between px-3">
        <ThemeToggle className="ml-2" />
        <IconButton label="Close menu" onClick={onClose}>
          <path d="M6 6l12 12M18 6L6 18" />
        </IconButton>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col justify-center gap-2 px-8 pb-24">
        {shopLinks.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            style={{ animationDelay: `${80 + index * 60}ms` }}
            className="flex animate-rise items-baseline gap-4 py-2 font-display text-5xl uppercase tracking-wide text-silver-strong"
          >
            <span className="font-sans text-xs tracking-[0.3em] text-ink-muted">0{index + 1}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-xs uppercase tracking-[0.3em] text-ink-muted">
        Live large. The world is yours.
      </p>
    </div>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  useOverlay(onClose);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[60] animate-fade bg-black/60 backdrop-blur-sm [animation-duration:0.2s]" onClick={onClose}>
      <div
        className="border-b border-line bg-bg px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <Form action="/shop" onSubmit={onClose} className="mx-auto flex max-w-3xl items-center gap-2">
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            ref={input}
            id="site-search"
            name="q"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search LVN’LARGE"
            className="h-14 min-w-0 flex-1 border-b border-line bg-transparent font-display text-2xl uppercase tracking-wide text-ink placeholder:text-ink-muted/60 focus:border-silver focus:outline-none"
          />
          <button type="button" onClick={onClose} className="h-11 px-3 text-sm uppercase tracking-[0.2em] text-ink-muted">
            Close
          </button>
        </Form>
      </div>
    </div>
  );
}
