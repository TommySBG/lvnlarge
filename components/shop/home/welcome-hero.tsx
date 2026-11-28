import Image from "next/image";
import welcome from "@/public/brand/welcome.jpg";
import { HeroWatcher } from "./hero-watcher";

/**
 * Full-screen welcome (brief §3, owner's design): the founder's photo fills
 * the screen, lightly blurred (still recognisable) under a soft dark overlay.
 * Centred stack: WELCOME (very big) / TO (small) / LVN'LARGE (luxury serif,
 * sharp silver) / "Live Large. The World Is Yours." (flowing script).
 */
export function WelcomeHero() {
  return (
    <section data-hero aria-labelledby="welcome-title" className="relative isolate flex h-svh min-h-[620px] items-center justify-center overflow-hidden bg-black text-center text-white">
      <HeroWatcher />

      {/* Photo sits slightly larger than the screen so the blur never shows soft edges. */}
      <div aria-hidden="true" className="absolute -inset-6 -z-20 animate-kenburns">
        <Image
          src={welcome}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-[50%_32%] blur-[3px] sm:blur-[4px]"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/40" />
      {/* Long, soft shadow at the top keeps the header's silver readable over the photo. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.1)_45%,rgba(0,0,0,0.7)_100%)]" />

      <div className="flex w-full max-w-5xl flex-col items-center px-4 pt-[calc(var(--header-total)*0.6)]">
        <h1 id="welcome-title" aria-label="Welcome to LVN’LARGE" className="text-pop flex flex-col items-center">
          <span aria-hidden="true" className="block animate-rise font-display text-[23vw] uppercase leading-[0.85] tracking-[0.03em] text-chrome-bright [animation-delay:250ms] sm:text-[9.5rem] lg:text-[12rem]">
            Welcome
          </span>
          <span aria-hidden="true" className="mt-2 block animate-rise pl-[0.6em] text-sm font-extrabold uppercase tracking-[0.6em] text-white/90 [animation-delay:500ms] sm:mt-3 sm:text-base">
            To
          </span>
          <span aria-hidden="true" className="mt-3 block animate-rise font-luxe text-[12.6vw] font-bold leading-none tracking-[0.04em] text-chrome-bright [animation-delay:750ms] sm:mt-4 sm:text-7xl lg:text-[6.5rem]">
            LVN’LARGE
          </span>
        </h1>
        <p className="text-pop mt-7 max-w-[18ch] animate-fade text-balance font-script text-[11vw] leading-[1.15] text-chrome-bright [animation-delay:1100ms] sm:mt-9 sm:max-w-none sm:text-6xl lg:text-7xl">
          Live Large. The World Is Yours.
        </p>
      </div>

      <a
        href="#collections"
        className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 animate-fade flex-col items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-white/80 [animation-delay:1500ms]"
      >
        Scroll
        <span aria-hidden="true" className="block h-10 w-px animate-scroll-cue bg-white/80" />
      </a>
    </section>
  );
}
