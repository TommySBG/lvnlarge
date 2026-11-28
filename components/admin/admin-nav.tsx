"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const items = [
  { href: "/admin", label: "Overview", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/admin/products", label: "Products", icon: "M4 7l8-4 8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10" },
  { href: "/admin/stock", label: "Stock", icon: "M4 20h16M7 16V9M12 16V4M17 16v-5" },
  { href: "/admin/collections", label: "Collections", icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z" },
  { href: "/admin/more", label: "More", icon: "M5 12h.01M12 12h.01M19 12h.01" },
];

const moreRoutes = ["/admin/more", "/admin/size-guides", "/admin/settings", "/admin/sign-ups", "/admin/gallery"];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/more") return moreRoutes.some((route) => pathname.startsWith(route));
  return pathname.startsWith(href);
}

// The current address is only known at request time, so each nav renders
// once without a highlight (static shell) and then streams in highlighted.

/** Desktop: links in the header. */
export function AdminTopNav() {
  return (
    <Suspense fallback={<TopNav pathname="" />}>
      <TopNavWithPath />
    </Suspense>
  );
}

function TopNavWithPath() {
  return <TopNav pathname={usePathname()} />;
}

function TopNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Admin" className="hidden items-center gap-1 md:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="rounded-full px-4 py-2 text-sm text-ink-muted transition-colors hover:text-silver-strong aria-[current=page]:bg-surface-2 aria-[current=page]:text-silver-strong"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Phone: fixed bottom tab bar within thumb reach. */
export function AdminBottomNav() {
  return (
    <Suspense fallback={<BottomNav pathname="" />}>
      <BottomNavWithPath />
    </Suspense>
  );
}

function BottomNavWithPath() {
  return <BottomNav pathname={usePathname()} />;
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-wide ${
                  active ? "text-silver-strong" : "text-ink-muted"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinejoin="round" strokeLinecap="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
