import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · LVN’LARGE Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <span className="font-display text-2xl uppercase tracking-wide text-silver-strong">
          LVN’LARGE <span className="text-sm tracking-[0.3em] text-ink-muted">Admin</span>
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Suspense fallback={null}>
            <AdminBadge />
          </Suspense>
        </div>
      </header>
      {/* Access check streams in; nothing inside renders until it passes. */}
      <Suspense fallback={<p className="p-6 text-sm text-ink-muted">Checking access…</p>}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <main className="flex-1 px-6 py-8">{children}</main>;
}

async function AdminBadge() {
  const admin = await requireAdmin();
  return (
    <form action={logout} className="flex items-center gap-3">
      <span className="hidden text-sm text-ink-muted sm:inline">
        {admin.displayName ?? admin.email} · <span className="capitalize">{admin.role.replace("_", " ")}</span>
      </span>
      <button
        type="submit"
        className="h-9 rounded-full border border-line px-4 text-xs uppercase tracking-[0.2em] text-silver transition-colors hover:border-silver"
      >
        Sign out
      </button>
    </form>
  );
}
