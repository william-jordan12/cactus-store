import StoreLayout from "@/components/StoreLayout";
import { Leaf, Sprout, Globe, Heart } from "lucide-react";
import { useSeo } from "@/lib/seo";

export default function About() {
  useSeo({ title: "About Us", description: "Learn about Peyote Seeds Farm — a small team of plant growers based in the southern US, growing and shipping rare cactus varieties to collectors worldwide.", canonical: "/about" });
  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">
            Our Story
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">
            About Cactus Store
          </h1>
          <p className="text-white/70 text-lg">
            Sourcing rare cacti and seeds from our greenhouse to collectors around the world.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl space-y-12">
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            We're a small team of plant growers based in the southern United States. What started as a backyard hobby turned into a full-time operation — we grow and ship rare cactus varieties to collectors worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <Sprout className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Ethically Grown</h3>
              <p className="text-sm text-muted-foreground">
                Every plant is propagated in our greenhouse. We never wild-harvest or damage natural populations.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Globe className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Worldwide Shipping</h3>
              <p className="text-sm text-muted-foreground">
                We ship to over 40 countries with carefully designed packaging to ensure your plants arrive healthy.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Leaf className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Viable Seeds</h3>
              <p className="text-sm text-muted-foreground">
                Our seeds are freshly harvested and tested for germination. We guarantee viability on all seed orders.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Heart className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Collector Focused</h3>
              <p className="text-sm text-muted-foreground">
                From beginner-friendly species to rare specimens, our catalog covers a wide range of difficulty levels.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold mb-4">What We're About</h2>
          <p className="text-muted-foreground leading-relaxed">
            We grow what we sell. Every plant and seed comes from our own greenhouse or from growers we trust. Our goal is simple: make it easy for collectors anywhere in the world to get healthy, greenhouse-grown cacti — without supporting wild collection.
          </p>
        </div>
      </section>
    </StoreLayout>
  );
}
