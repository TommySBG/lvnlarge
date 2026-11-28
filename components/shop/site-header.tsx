"use client";

import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import logo from "@/public/brand/logo.png";
import { ThemeToggle } from "@/components/theme-toggle";
import { shopLinks } from "@/lib/shop/links";

/**
 * Site header on every shop page. Always dark frosted glass so it stays
 * readable over any content (see .site-header in globals.css). Desktop: big
 * silver logo, each link in its own glass pill, bold silver icons. iPhone:
 * logo in the middle, links in a full-screen glass menu.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <SilverGradient />
      <header className="site-header fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid h-[var(--header-h)] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-2 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
          {/* Phone: menu button on the left */}
          <div className="flex items-center lg:hidden">
            <IconButton label="Open menu" onClick={() => setMenuOpen(true)}>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </IconButton>
          </div>

          <Link href="/" aria-label="LVN’LARGE home" className="justify-self-center lg:justify-self-start">
            <Image src={logo} alt="" priority className="logo-silver h-[3.6rem] w-auto lg:h-[4.25rem]" />
          </Link>

          <Suspense fallback={<NavPills pathname="" />}>
            <NavPillsWithPath />
          </Suspense>

          <div className="flex items-center justify-end">
            <IconButton label="Search" onClick={() => setSearchOpen(true)}>
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4.2-4.2" />
            </IconButton>
            <ThemeToggle plain className="hidden min-[360px]:inline-flex" />
            {/* The bag is built in step 4 (bag & payment). */}
            <button type="button" disabled title="Your bag opens soon" aria-label="Bag (opens soon)" className="inline-flex h-11 w-11 items-center justify-center rounded-full opacity-70">
              <SilverIcon>
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V7a3 3 0 016 0v1" />
              </SilverIcon>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

/** One shared silver gradient for every header icon (stroke="url(#lvn-silver-stroke)"). */
function SilverGradient() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <linearGradient id="lvn-silver-stroke" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#c9ced5" />
          <stop offset="0.6" stopColor="#ffffff" />
          <stop offset="1" stopColor="#aab0b8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SilverIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" fill="none" stroke="url(#lvn-silver-stroke)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95">
      <SilverIcon>{children}</SilverIcon>
    </button>
  );
}

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`) || (href === "/shop" && pathname.startsWith("/product/"));
}

// The current address is only known at request time: render once without a
// highlight (static shell), then stream in the highlighted version.
function NavPillsWithPath() {
  return <NavPills pathname={usePathname()} />;
}

function NavPills({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="hidden justify-center lg:flex">
      <ul className="flex items-center gap-2.5">
        {shopLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined} className="glass-pill inline-flex min-h-11 items-center rounded-full px-5">
              <span className="text-chrome-bright text-sm font-extrabold uppercase tracking-[0.14em]">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
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

/** iPhone menu: frosted glass over the page, each link a big glass pill. */
function MobileMenu({ onClose }: { onClose: () => void }) {
  useOverlay(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="glass-sheet fixed inset-0 z-[60] flex animate-fade flex-col pt-[env(safe-area-inset-top)] text-white [animation-duration:0.3s]">
      <div className="flex h-[var(--header-h)] items-center justify-between px-2">
        <ThemeToggle plain />
        <Image src={logo} alt="" className="logo-silver h-[3.6rem] w-auto" />
        <IconButton label="Close menu" onClick={onClose}>
          <path d="M6 6l12 12M18 6L6 18" />
        </IconButton>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col justify-center px-6 pb-20">
        <ul className="flex flex-col gap-3.5">
          {shopLinks.map((link, index) => (
            <li key={link.href} className="animate-rise" style={{ animationDelay: `${60 + index * 60}ms` }}>
              <Link href={link.href} onClick={onClose} className="glass-pill flex min-h-16 items-center justify-between rounded-full px-7">
                <span className="text-chrome-bright font-display text-3xl uppercase tracking-wide">{link.label}</span>
                <span aria-hidden="true" className="text-chrome-bright text-xl font-bold">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="pb-[calc(2rem+env(safe-area-inset-bottom))] text-center font-script text-3xl text-chrome-bright">Live Large. The World Is Yours.</p>
    </div>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  useOverlay(onClose);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[60] animate-fade bg-black/60 backdrop-blur-sm [animation-duration:0.2s]" onClick={onClose}>
      <div className="glass-sheet px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] text-white sm:px-6" onClick={(event) => event.stopPropagation()}>
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
            className="h-14 min-w-0 flex-1 border-b border-white/30 bg-transparent font-display text-2xl uppercase tracking-wide text-white placeholder:text-white/45 focus:border-white focus:outline-none"
          />
          <button type="button" onClick={onClose} className="h-11 px-3 text-sm font-bold uppercase tracking-[0.2em] text-white/80">
            Close
          </button>
        </Form>
      </div>
    </div>
  );
}
