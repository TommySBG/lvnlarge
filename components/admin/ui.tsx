import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Mobile-first admin building blocks. Inputs use text-base (16px) so iOS
// Safari never zooms in; buttons are at least 44px tall for thumbs.

export const inputClass =
  "block h-12 w-full rounded-lg border border-line bg-surface-2 px-4 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-silver disabled:opacity-60";

export const textareaClass =
  "block min-h-32 w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-ink outline-none transition-colors focus:border-silver";

const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold uppercase tracking-[0.15em] transition-colors disabled:opacity-50";

export const buttonClass = {
  primary: `${buttonBase} bg-army text-on-army hover:bg-army-strong`,
  secondary: `${buttonBase} border border-line text-silver-strong hover:border-silver`,
  danger: `${buttonBase} border border-danger/50 text-danger hover:bg-danger/10`,
  icon: "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line text-silver-strong transition-colors hover:border-silver disabled:opacity-30",
};

export function PageHeader({
  title,
  description,
  back,
  action,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-ink-muted hover:text-silver-strong"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl uppercase tracking-wide break-words text-silver-strong sm:text-4xl">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-xl border border-line bg-surface p-4 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-silver-strong">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

/** A large on/off switch built on a real checkbox (works without JavaScript). */
export function Toggle({
  name,
  label,
  hint,
  defaultChecked,
  ...rest
}: { name: string; label: string; hint?: string } & Omit<ComponentProps<"input">, "type">) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-2">
      <span className="flex flex-col">
        <span className="text-base text-ink">{label}</span>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" {...rest} />
      <span
        aria-hidden="true"
        className="relative h-8 w-14 shrink-0 rounded-full border border-line bg-surface-2 transition-colors after:absolute after:left-1 after:top-1 after:h-5.5 after:w-5.5 after:rounded-full after:bg-ink-muted after:transition-transform peer-checked:border-army-strong peer-checked:bg-army peer-checked:after:translate-x-6 peer-checked:after:bg-on-army peer-focus-visible:outline-2 peer-focus-visible:outline-silver"
      />
    </label>
  );
}

const badgeTones = {
  neutral: "border-line text-ink-muted",
  good: "border-army-strong bg-army/30 text-on-army",
  warn: "border-amber-500/50 text-amber-500",
  bad: "border-danger/50 text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" | "archived" }) {
  const tone = status === "published" ? "good" : status === "archived" ? "bad" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-muted">
      {children}
    </p>
  );
}

export function ArrowUp() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function ArrowDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}
