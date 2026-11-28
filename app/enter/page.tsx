import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import welcome from "@/public/brand/welcome.jpg";
import logo from "@/public/brand/logo.png";
import { EnterForm, EnterFormWithNext } from "./enter-form";

export const metadata: Metadata = {
  title: "Enter",
  robots: { index: false },
};

// Email gate (compulsory for every visitor). A small glass box centred over a
// blurred campaign photo, then on to the welcome screen.
export default function EnterPage() {
  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-black px-5 py-16">
      <Image
        src={welcome}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-20 scale-110 object-cover object-top blur-2xl brightness-[0.55] saturate-[0.6]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(11,11,12,0.15),rgba(11,11,12,0.85))]" />

      <section
        aria-labelledby="enter-title"
        className="w-full max-w-[26rem] animate-rise rounded-[1.75rem] border border-white/15 bg-white/[0.07] p-7 text-center text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-9"
      >
        <Image src={logo} alt="LVN’LARGE" priority className="mx-auto h-auto w-24 drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)] sm:w-28" />
        <h1 id="enter-title" className="mt-5 font-display text-3xl uppercase tracking-[0.08em] text-chrome animate-sheen sm:text-4xl">
          Enter LVN’LARGE
        </h1>
        <p className="mt-2 text-sm text-white/70">Enter your email to step inside the store.</p>

        <Suspense fallback={<EnterForm next="/" />}>
          <EnterFormWithNext />
        </Suspense>
      </section>
    </main>
  );
}
