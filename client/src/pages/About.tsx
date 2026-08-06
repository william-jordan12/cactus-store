import StoreLayout from "@/components/StoreLayout";
import { Sprout, Globe, ShieldCheck, PackageCheck } from "lucide-react";
import { useSeo } from "@/lib/seo";

export default function About() {
  useSeo({
    title: "About Us — Our Greenhouse & Growing Story",
    description: "Learn about Peyote Seeds Vault — how we grow rare cactus varieties in our greenhouse, why we never wild-harvest, and what's behind our germination guarantee.",
    canonical: "/about",
  });
  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">
            Our Story
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">
            About Peyote Seeds Vault
          </h1>
          <p className="text-white/70 text-lg">
            A grower-run nursery for rare cacti and seeds — greenhouse-grown, never wild-collected.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl space-y-12">
        {/* Who We Are — the E-E-A-T core */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            Peyote Seeds Vault is a grower-run nursery in Texas. We're a cactus collector turned full-time grower, and we grow most of what we sell — the rest comes from growers we know personally. Every plant and seed is propagated under controlled conditions, never pulled from the wild.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Indigenous oral tradition tells of a distraught woman who fell asleep on a patch of cacti while searching for her lost brothers. She received a vision from the plant revealing their safe location — establishing peyote as a sacred guide and visionary medicine. That story is the reason we treat these plants with respect: the tradition behind the cactus is older than any of us, and our work is about keeping it alive through responsible cultivation, not wild collection.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <Sprout className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Greenhouse-Propagated</h3>
              <p className="text-sm text-muted-foreground">
                Every plant is grown from seed or cutting in our own greenhouse. We never wild-harvest, and we buy from suppliers who can prove the same.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <ShieldCheck className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Germination Guarantee</h3>
              <p className="text-sm text-muted-foreground">
                Seeds are freshly harvested and test-sown before listing. If your seeds fail to germinate using our included guide, we replace them — see our Returns page.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <PackageCheck className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Ship-Ready Packaging</h3>
              <p className="text-sm text-muted-foreground">
                We hand-pack every order: [FILL IN A PACKAGING DETAIL, e.g. "sealed tubes for seeds, root-protective padding for live plants, and heat packs in winter"].
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Globe className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Worldwide Shipping</h3>
              <p className="text-sm text-muted-foreground">
                We ship to over 40 countries, with documentation and customs-compliant labeling so your order clears without surprises.
              </p>
            </div>
          </div>
        </div>

        {/* The Grower */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Meet the Grower</h2>
          <p className="text-muted-foreground leading-relaxed">
            We've been growing cacti for five years, specializing in Astrophytum, germination kits, grafting, and cactus accessories — and we've killed plenty along the way. That's exactly why our care guides (on the blog) are written from real experience, not theory.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            You can reach us directly at peyoteseedsfarm@gmail.com — we personally answer every message. There's no support desk; when you write, you're writing to the people who grew your plant.
          </p>
        </div>

        {/* Why Us */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Why We Exist</h2>
          <p className="text-muted-foreground leading-relaxed">
            Wild cactus populations are under pressure from habitat loss and illegal collection — especially slow-growing species that take decades to mature. The cactus collecting community has a real choice to make, and we believe the answer is greenhouse-grown plants and seeds, traded openly and sustainably.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Every plant we sell was propagated, not poached. That's the standard we hold ourselves to, and it's the standard we want to see across the hobby.
          </p>
        </div>
      </section>
    </StoreLayout>
  );
}
