import { Footer } from "@/components/footer";
import { LenisProvider } from "@/components/landing/lenis-provider";
import { RingBackdrop } from "@/components/landing/ring-backdrop";
import { Hero } from "@/components/landing/hero";
import { Fracture } from "@/components/landing/fracture";
import { Ascent } from "@/components/landing/ascent";
import { Proof } from "@/components/landing/proof";
import { Pillars } from "@/components/landing/pillars";
import { Pricing } from "@/components/landing/pricing";
import { bricolage } from "@/lib/fonts";

export default function Page() {
  return (
    <LenisProvider>
      <main className={`landing-root relative bg-[rgb(var(--lp-paper))] text-[rgb(var(--lp-ink))] ${bricolage.variable}`}>
        {/* one persistent red ring behind every section; it morphs with scroll */}
        <RingBackdrop />
        <Hero />
        <Fracture />
        <Ascent />
        <Proof />
        <Pillars />
        <Pricing />
        <Footer />
      </main>
    </LenisProvider>
  );
}
