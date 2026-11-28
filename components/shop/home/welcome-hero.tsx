import Image from "next/image";
import welcome from "@/public/brand/welcome.jpg";
import { HeroWatcher } from "./hero-watcher";

/**
 * Full-screen welcome (brief §3): the founder's photo, "WELCOME TO LIVING
 * LARGE" and "LIVE LARGE. THE WORLD IS YOURS.", then scroll into the store.
 * Phones: the photo fills the screen. Desktop: blurred backdrop + framed portrait.
 */
export function WelcomeHero() {
  return (
    <section data-hero aria-labelledby="welcome-title" className="relative isolate flex h-svh min-h-[600px] overflow-hidden bg-black text-white">
      <HeroWatcher />
      <Image
        src={welcome}
        alt="The LVN’LARGE founder in a ‘Young And Motion Inclined’ tee"
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-20 animate-kenburns object-cover object-[50%_30%] lg:scale-110 lg:blur-2xl lg:brightness-50"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/10 to-black/90 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/40 lg:to-black/30" />

      <div className="mx-auto flex w-full max-w-7xl flex-col justify-end px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:pb-0">
        <div className="max-w-2xl">
          <p className="animate-rise text-[11px] font-medium uppercase tracking-[0.45em] text-white/70 [animation-delay:300ms]">LVN’LARGE · Est. Nigeria</p>
          <h1 id="welcome-title" className="mt-4 font-display uppercase leading-[0.86] tracking-wide">
            <span className="block animate-rise text-[15vw] text-white/90 [animation-delay:450ms] sm:text-7xl lg:text-8xl">Welcome to</span>
            <span className="block animate-rise text-[19vw] text-chrome [animation-delay:600ms] sm:text-8xl lg:text-[9rem]">Living Large</span>
          </h1>
          <p className="mt-6 animate-rise text-sm font-medium uppercase tracking-[0.32em] text-white/80 [animation-delay:800ms] sm:text-base">
            Live large. The world is yours.
          </p>
        </div>

        <div className="relative hidden aspect-[3/4] h-[74vh] max-h-[760px] animate-fade overflow-hidden rounded-[2rem] border border-white/15 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] [animation-delay:500ms] lg:block">
          <Image src={welcome} alt="" fill sizes="40vw" placeholder="blur" className="object-cover" />
        </div>
      </div>

      <a
        href="#collections"
        className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 animate-fade flex-col items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-white/70 [animation-delay:1200ms]"
      >
        Scroll
        <span aria-hidden="true" className="block h-10 w-px animate-scroll-cue bg-white/80" />
      </a>
    </section>
  );
}
