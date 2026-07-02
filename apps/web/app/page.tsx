import { ParticleField } from "@/components/landing/particle-field";
import { LandingBackground } from "@/components/landing/landing-background";
import { ScrollNav } from "@/components/landing/scroll-nav";
import { ScrollFilm } from "@/components/landing/scroll-film";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main className="theme-dark relative bg-bg text-text-1">
      <LandingBackground />
      <ParticleField />
      <div className="relative z-10">
        <ScrollNav />
        <ScrollFilm />
        <Footer />
      </div>
    </main>
  );
}
