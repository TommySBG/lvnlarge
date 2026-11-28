import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

export type ComingSoonItem = { slug: string; name: string; image: string | null };

// Teaser words only (what's on the way) — the actual items shown come from the
// admin: products marked "Coming soon".
const teasers = ["Rings", "Wristwatches", "Chains", "Shades", "Beanies", "Belts"];

/**
 * Campaign photo with the upcoming pieces floating over it. Coming-soon
 * products are visible but can never be bought until the owner releases them.
 */
export function ComingSoon({ items, background }: { items: ComingSoonItem[]; background: string | StaticImageData }) {
  const words = [...teasers, ...teasers];
  return (
    <section aria-labelledby="coming-soon-title" className="reveal relative isolate overflow-hidden bg-black text-white">
      <Image src={background} alt="" fill sizes="100vw" className="-z-20 object-cover object-[50%_25%] opacity-70" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/30 to-black/90" />

      <div className="mx-auto flex min-h-[86svh] max-w-7xl flex-col justify-between gap-10 px-5 py-16 sm:px-8 sm:py-24">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-white/70">Next drop</p>
          <h2 id="coming-soon-title" className="mt-3 font-display text-6xl uppercase leading-none tracking-wide text-chrome sm:text-8xl">
            Coming Soon
          </h2>
          <p className="mt-3 text-sm uppercase tracking-[0.25em] text-white/70">Accessories &amp; headwear by LVN’LARGE</p>
        </div>

        {items.length > 0 && (
          <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:mx-0 sm:justify-center sm:px-0">
            {items.map((item) => (
              <li key={item.slug} className="w-[42vw] max-w-[220px] shrink-0 snap-start">
                <Link href={`/product/${item.slug}`} className="block rounded-xl bg-white p-1.5 text-black shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                    {item.image && <Image src={item.image} alt="" fill sizes="220px" className="object-cover" />}
                  </div>
                  <p className="truncate px-1 pt-2 text-xs font-semibold">{item.name}</p>
                  <p className="px-1 pb-1 text-[10px] uppercase tracking-[0.2em] text-neutral-500">Coming soon</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div>
          <div className="overflow-hidden border-y border-white/20 py-4" aria-hidden="true">
            <div className="flex w-max animate-marquee gap-8 [--marquee-duration:28s]">
              {words.map((word, i) => (
                <span key={i} className="flex items-center gap-8 font-display text-3xl uppercase tracking-wide text-white/85 sm:text-4xl">
                  {word}
                  <span className="text-lg text-[#9aa66a]">✦</span>
                </span>
              ))}
            </div>
          </div>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-white/60">
            {items.length > 0 ? `${items.length} ${items.length === 1 ? "piece" : "pieces"} on the way` : "Rings, watches, chains, shades and beanies — on the way"}
          </p>
        </div>
      </div>
    </section>
  );
}
