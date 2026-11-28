import Image from "next/image";
import Link from "next/link";
import logo from "@/public/brand/logo.png";
import { shopLinks } from "@/lib/shop/links";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-16 sm:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-sm">
            <Image src={logo} alt="" className="h-16 w-auto" />
            <p className="mt-6 text-sm leading-relaxed text-ink-muted">
              Wear luxury. Feel luxury. Be luxury. Premium streetwear from Nigeria. Orders are collected in person; we contact you after
              payment to arrange pickup.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm uppercase tracking-[0.18em]">
            {shopLinks.slice(1).map((link) => (
              <Link key={link.href} href={link.href} className="text-ink-muted transition-colors hover:text-silver-strong">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p aria-hidden="true" className="mt-16 select-none font-display text-[19vw] uppercase leading-[0.8] tracking-tight text-chrome opacity-90 md:text-[15vw]">
          LVN’LARGE
        </p>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 text-xs uppercase tracking-[0.2em] text-ink-muted sm:flex-row sm:justify-between">
          <span>© 2026 LVN’LARGE</span>
          <span>Live large. The world is yours.</span>
        </div>
      </div>
    </footer>
  );
}
