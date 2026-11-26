import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.4em] text-silver">Admin</p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wide text-silver-strong">
          LVN’LARGE
        </h1>
        <p className="mt-2 mb-8 text-sm text-ink-muted">Sign in to manage the store.</p>
        <LoginForm />
      </div>
    </main>
  );
}
