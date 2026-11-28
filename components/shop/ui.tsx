import Link from "next/link";
import type { ReactNode } from "react";

/** Section heading: small eyebrow + big chrome title. */
export function SectionHeading({
  eyebrow,
  title,
  action,
  id,
}: {
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
  id?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-ink-muted">{eyebrow}</p>
        <h2 id={id} className="mt-2 font-display text-4xl uppercase leading-none tracking-wide text-chrome sm:text-6xl">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="hidden shrink-0 text-xs uppercase tracking-[0.25em] text-ink-muted hover:text-silver-strong sm:block">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

/** Pill button link (silver on dark, graphite on light). */
export function PillLink({ href, children, variant = "solid" }: { href: string; children: ReactNode; variant?: "solid" | "outline" }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-7 text-xs font-semibold uppercase tracking-[0.28em] transition-transform active:scale-[0.98] ${
        variant === "solid" ? "bg-silver-strong text-bg hover:bg-ink" : "border border-line text-silver-strong hover:border-silver"
      }`}
    >
      {children}
    </Link>
  );
}

/** Page title block for inner pages (sits below the fixed header). */
export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mx-auto max-w-7xl px-4 pb-8 pt-28 sm:px-8 sm:pt-36">
      <p className="animate-rise text-[11px] font-medium uppercase tracking-[0.35em] text-ink-muted">{eyebrow}</p>
      <h1 className="mt-3 animate-rise font-display text-6xl uppercase leading-[0.9] tracking-wide text-chrome [animation-delay:80ms] sm:text-8xl">
        {title}
      </h1>
      {children && <div className="mt-4 max-w-xl animate-rise text-sm leading-relaxed text-ink-muted [animation-delay:160ms]">{children}</div>}
    </header>
  );
}
