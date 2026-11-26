import { ThemeToggle } from "@/components/theme-toggle";

// Temporary holding page. The real storefront (email entry, welcome screen,
// home page) is built in roadmap step 3.
export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <ThemeToggle className="absolute right-6 top-6" />
      <p className="text-xs uppercase tracking-[0.4em] text-silver">Living Large</p>
      <h1 className="font-display text-6xl uppercase tracking-wide text-silver-strong sm:text-8xl">
        LVN’LARGE
      </h1>
      <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">
        Wear luxury. Feel luxury. Be luxury.
      </p>
      <span className="mt-6 h-px w-16 bg-army-strong" aria-hidden="true" />
      <p className="text-ink-muted">The store is being built. Launching December 2026.</p>
    </main>
  );
}
