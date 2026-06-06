import { ParticleField } from "@/components/landing/particle-field";
import { ScrollNav } from "@/components/landing/scroll-nav";
import { ScrollFilm } from "@/components/landing/scroll-film";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main className="theme-dark relative bg-bg text-text-1">
      <ParticleField />
      <ScrollNav />
      <ScrollFilm />
      <Footer />
    </main>
  );
}
