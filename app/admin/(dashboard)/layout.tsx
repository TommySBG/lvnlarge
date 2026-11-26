import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminBottomNav, AdminTopNav } from "@/components/admin/admin-nav";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · LVN’LARGE Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="font-display text-2xl uppercase tracking-wide text-silver-strong">
            LVN’LARGE <span className="text-xs tracking-[0.3em] text-ink-muted">Admin</span>
          </Link>
          <AdminTopNav />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Suspense fallback={null}>
              <AdminSignOut />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Access check streams in; nothing inside renders until it passes. */}
      <Suspense fallback={<p className="p-6 text-sm text-ink-muted">Checking access…</p>}>
        <AdminGate>{children}</AdminGate>
      </Suspense>

      <AdminBottomNav />
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    // Bottom padding keeps content clear of the phone tab bar.
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-12">
      {children}
    </main>
  );
}

async function AdminSignOut() {
  await requireAdmin();
  return (
    <form action={logout} className="hidden md:block">
      <button
        type="submit"
        className="h-9 rounded-full border border-line px-4 text-xs uppercase tracking-[0.2em] text-silver transition-colors hover:border-silver"
      >
        Sign out
      </button>
    </form>
  );
}
