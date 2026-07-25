import StoreLayout from "@/components/StoreLayout";
import { Leaf, Sprout, Globe, Heart } from "lucide-react";

export default function About() {
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
            Passionate about bringing unique, ethically sourced cacti and succulents to collectors worldwide.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl space-y-12">
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            We are a small, dedicated team of plant enthusiasts based in the southern United States. What started as a backyard hobby quickly grew into a full-time passion for cultivating and sharing rare and unusual cactus varieties with fellow collectors around the world.
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
                From beginner-friendly species to rare specimens, we curate our catalog for collectors of all levels.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe everyone deserves access to beautiful, unique plants — no matter where they live. Our goal is to make rare and fascinating cacti accessible to enthusiasts everywhere while maintaining the highest standards of ethical cultivation and customer care.
          </p>
        </div>
      </section>
    </StoreLayout>
  );
}
