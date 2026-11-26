import type { Metadata } from "next";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: "No access",
  robots: { index: false, follow: false },
};

export default function NoAccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 text-center sm:p-10">
        <h1 className="font-display text-3xl uppercase tracking-wide text-silver-strong">
          No admin access
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          This account is signed in but is not an LVN’LARGE administrator.
        </p>
        <form action={logout} className="mt-8">
          <button
            type="submit"
            className="h-11 w-full rounded-md border border-line text-sm uppercase tracking-[0.25em] text-silver transition-colors hover:border-silver"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
