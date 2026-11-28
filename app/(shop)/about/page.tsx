import type { Metadata } from "next";
import Image from "next/image";
import logo from "@/public/brand/logo.png";
import { PillLink } from "@/components/shop/ui";

export const metadata: Metadata = {
  title: "About",
  description: "The story of LVN’LARGE — Living Large.",
};

// PLACEHOLDER STORY: the owner will provide and approve the real brand story
// (brief §18). Only the parts below marked "confirmed" come from the brief.
const story = [
  {
    heading: "How it started",
    // TODO(owner): origin story.
    body: "The full LVN’LARGE story is being written by the founder and will appear here soon.",
    placeholder: true,
  },
  {
    heading: "What Living Large means",
    // Confirmed in the brief (§1–2).
    body: "LVN’LARGE is built on creativity, individuality, self-expression and premium fashion. Wear luxury. Feel luxury. Be luxury. Live large — the world is yours.",
    placeholder: false,
  },
  {
    heading: "The founder",
    // TODO(owner): founder journey.
    body: "The founder’s journey is coming soon.",
    placeholder: true,
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative mx-auto flex aspect-square max-w-md animate-fade items-center justify-center rounded-[2.5rem] border border-line bg-[radial-gradient(circle_at_50%_40%,var(--surface-2),var(--bg)_70%)]">
            <Image src={logo} alt="LVN’LARGE logo" priority className="h-auto w-3/5 drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]" />
          </div>
        </div>

        <div>
          <p className="animate-rise text-[11px] font-medium uppercase tracking-[0.35em] text-ink-muted">About LVN’LARGE</p>
          <h1 className="mt-3 animate-rise font-display text-6xl uppercase leading-[0.9] tracking-wide text-chrome [animation-delay:80ms] sm:text-8xl">Living Large</h1>

          <div className="mt-12 flex flex-col gap-12">
            {story.map((part, index) => (
              <section key={part.heading} className="reveal border-t border-line pt-8">
                <p className="text-xs tracking-[0.3em] text-ink-muted">0{index + 1}</p>
                <h2 className="mt-2 font-display text-3xl uppercase tracking-wide text-silver-strong">{part.heading}</h2>
                <p className={`mt-4 max-w-xl text-base leading-relaxed ${part.placeholder ? "italic text-ink-muted" : "text-ink"}`}>{part.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-14">
            <PillLink href="/shop">Shop LVN’LARGE</PillLink>
          </div>
        </div>
      </div>
    </div>
  );
}
