import StoreLayout from "@/components/StoreLayout";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";

const posts = [
  {
    slug: "how-to-grow-cactus-from-seed",
    title: "How to Grow Cactus From Seed: A Beginner's Guide",
    excerpt: "Growing cactus from seed requires patience, but it's worth the effort. Here's everything you need to know to get started with sterile soil, humidity control, and proper light.",
    date: "July 18, 2026",
    readTime: "6 min read",
    category: "Growing Tips",
    image: "https://peyoteseedsfarm.com/wp-content/uploads/2025/10/ChatGPT-Image-Oct-22-2025-05_44_09-AM-1-200x300.png",
    content: `Starting cactus from seed is one of the best parts of plant collecting. Unlike purchasing mature plants, growing from seed lets you watch every stage of development — from a tiny green speck to a robust, mature cactus.\n\n**What You'll Need**\n\n- Sterile cactus soil mix (or make your own with perlite, pumice, and fine sand)\n- Shallow containers with drainage holes\n- Clear humidity dome or plastic wrap\n- Spray bottle for misting\n- Warm location with indirect sunlight (25-28°C / 77-82°F)\n\n**Step-by-Step Process**\n\n1. Fill your container with pre-moistened soil mix. The soil should be damp, not waterlogged.\n2. Scatter seeds evenly across the surface. Do not bury them — cactus seeds need light to germinate.\n3. Mist the surface gently and cover with a humidity dome or plastic wrap.\n4. Place in a warm spot with bright, indirect light. Direct sunlight will cook seedlings.\n5. Mist daily to maintain humidity. Open the dome for 10 minutes every few days to prevent mold.\n6. Expect germination in 7-21 days depending on species.\n\n**Common Mistakes**\n\n- Overwatering: soggy soil causes damping off (seedling collapse)\n- Too much sun: seedlings are far more delicate than mature plants\n- Using regular potting soil: it retains too much moisture and harbors pathogens\n\nBe patient. Cactus seedlings are slow growers, but each tiny pad is a victory.`,
  },
  {
    slug: "best-cactus-soil-mix",
    title: "The Best Soil Mix for Cactus and Succulents",
    excerpt: "Not all soil is created equal. Learn why well-draining soil is critical for cactus health and how to mix the perfect substrate at home.",
    date: "July 12, 2026",
    readTime: "5 min read",
    category: "Plant Care",
    image: "https://peyoteseedsfarm.com/wp-content/uploads/2025/10/ChatGPT-Image-Oct-22-2025-05_23_59-AM-1-300x300.png",
    content: `The number one cause of cactus death isn't neglect — it's root rot from poor soil. Cacti evolved in rocky, sandy desert environments where water drains away almost immediately. Replicating that at home is the key to healthy roots.\n\n**The Ideal Mix**\n\nA great cactus soil has three components:\n\n- **Gritty material** (50%): pumice, perlite, or coarse sand — creates air pockets and drainage\n- **Organic material** (30%): coconut coir or peat-free compost — provides nutrients\n- **Fine aggregate** (20%): small gravel or akadama — adds weight and stability\n\n**Why Store-Bought "Cactus Soil" Isn't Enough**\n\nMost commercial cactus mixes still hold too much water. They're a starting point, not a solution. Always amend with extra perlite or pumice (at least 1:1 ratio with the mix).\n\n**Signs Your Soil Is Too Heavy**\n\n- Water sits on the surface after watering\n- Soil stays wet for more than 3-4 days\n- Roots appear brown or mushy\n- Plant base softens or discolors\n\nRepotting into proper soil is the single best thing you can do for your cactus.`,
  },
  {
    slug: "common-cactus-pests",
    title: "Common Cactus Pests and How to Deal With Them",
    excerpt: "Even the toughest desert plants face threats from pests. Learn to identify and treat the most common issues before they spread to your collection.",
    date: "July 5, 2026",
    readTime: "5 min read",
    category: "Plant Care",
    image: "https://peyoteseedsfarm.com/wp-content/uploads/2025/10/ChatGPT-Image-Oct-22-2025-05_37_21-AM-1-300x300.png",
    content: `Cacti are hardy plants, but they're not immune to pests. Mealybugs, spider mites, and scale are the most common invaders — and they can devastate a collection if left unchecked.\n\n**Mealybugs**\n\nWhite, cotton-like clusters in the joints and roots of your cactus. They suck sap and secrete honeydew, which attracts ants and promotes fungal growth.\n\nTreatment: Dab with 70% isopropyl alcohol using a cotton swab. For heavy infestations, spray with neem oil solution weekly.\n\n**Spider Mites**\n\nTiny red or brown dots on the surface with fine webbing between spines. Leaves and stems appear stippled or bronze.\n\nTreatment: Spray the entire plant with water to dislodge mites, then apply neem oil or insecticidal soap. Isolate the plant immediately.\n\n**Scale Insects**\n\nBrown or tan bumps that look like part of the plant's skin. They're actually armored insects feeding on sap.\n\nTreatment: Scrape off gently with a soft brush, then apply rubbing alcohol. Repeat weekly until clear.\n\n**Prevention Tips**\n\n- Inspect new plants thoroughly before introducing them to your collection\n- Quarantine new additions for 2 weeks\n- Maintain good airflow around plants\n- Avoid overwatering — stressed plants attract more pests`,
  },
  {
    slug: "watering-cactus-guide",
    title: "How to Water Cactus Plants Properly",
    excerpt: "Watering seems simple, but it's the most common place where cactus care goes wrong. Here's the right way to water — and when to stop.",
    date: "June 28, 2026",
    readTime: "4 min read",
    category: "Growing Tips",
    image: "https://peyoteseedsfarm.com/wp-content/uploads/2025/10/ChatGPT-Image-Oct-22-2025-05_17_06-AM-1-200x300.png",
    content: `The golden rule of cactus watering: when in doubt, don't water. Cacti store water in their stems and roots, and they're built to survive drought. Overwatering kills far more cacti than underwatering.\n\n**The Soak-and-Dry Method**\n\n1. Check if the soil is completely dry by inserting a wooden stick 2 inches into the soil. If it comes out clean and dry, water.\n2. Water thoroughly until it runs out the drainage holes.\n3. Allow all excess water to drain completely.\n4. Don't water again until the soil is bone dry throughout.\n\n**Seasonal Adjustments**\n\n- **Spring/Summer** (growing season): Water every 1-2 weeks, depending on heat and light\n- **Fall**: Reduce to every 3-4 weeks as growth slows\n- **Winter** (dormancy): Water once a month or not at all. Many species rest completely\n\n**Signs of Overwatering**\n\n- Soft, translucent stems\n- Black or brown spots at the base\n- Mushy roots when checked\n- Fungus gnats around the soil\n\n**Signs of Underwatering** (less common)\n\n- Wrinkled or shriveled stems\n- Plant pulling away from the soil\n- Dry, crispy roots\n\nWhen in doubt, underwater. Your cactus will forgive you for drought. It won't forgive you for rot.`,
  },
  {
    slug: "why-sustainable-cactus-trade-matters",
    title: "Why Sustainable Cactus Trade Matters",
    excerpt: "The demand for rare cacti is rising. Here's how ethical growers are protecting wild populations while meeting collector demand.",
    date: "June 20, 2026",
    readTime: "6 min read",
    category: "Ethics & Sustainability",
    image: "https://peyoteseedsfarm.com/wp-content/uploads/2025/10/ChatGPT-Image-Oct-22-2025-06_11_59-AM-1-300x300.png",
    content: `Wild cactus populations are under threat. Habitat loss, climate change, and illegal collection have pushed many species to the brink. The rise of online plant sales has made rare species more accessible — but it's also created a shadow market for wild-harvested specimens.\n\n**The Problem**\n\nMany rare cacti — particularly Lophophora and Astrophytum species — are collected from the wild and sold as "collected" or "wild-grown" specimens. These plants can be 20-50 years old, and removing them from their habitat is devastating to local ecosystems.\n\n**How Ethical Growers Help**\n\n- **Greenhouse propagation**: Growing from seed eliminates the need for wild collection\n- **Tissue culture**: Lab-grown specimens produce identical plants without touching wild populations\n- **Seed exchange**: Collectors sharing seeds reduces demand for wild-collected plants\n\n**What You Can Do**\n\n1. Always ask whether a plant is greenhouse-grown or wild-collected\n2. Buy seeds rather than mature plants when possible\n3. Support nurseries that are transparent about their sourcing\n4. Never collect wild cacti yourself — it's illegal in most jurisdictions\n\nThe cactus community has a responsibility to protect the species we love. Every greenhouse-grown plant is one less taken from the wild.`,
  },
];

export default function Blog() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">Journal</p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">Blog</h1>
          <p className="text-white/70 text-lg">
            Tips, guides, and stories from our greenhouse to your collection.
          </p>
        </div>
      </section>

      <section className="container py-12 max-w-3xl">
        {posts.map((post, i) => (
          <article
            key={post.slug}
            className={`border-b border-border ${i === 0 ? "pb-10 mb-10" : "py-10"}`}
          >
            <div className="md:flex gap-6">
              {/* Thumbnail */}
              <div className="md:w-48 md:shrink-0 mb-4 md:mb-0">
                <div className="aspect-[3/2] rounded-xl overflow-hidden bg-muted">
                  <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                  <span className="bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readTime}
                  </span>
                </div>

                <h2 className="font-display text-xl md:text-2xl font-bold mb-3 text-foreground">
                  {post.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {post.excerpt}
                </p>

            {expanded === post.slug ? (
              <div className="prose prose-sm text-muted-foreground max-w-none">
                {post.content.split("\n").map((para, j) => {
                  if (!para.trim()) return null;
                  if (para.startsWith("**") && para.endsWith("**")) {
                    return (
                      <h3 key={j} className="font-display text-lg font-bold text-foreground mt-6 mb-2">
                        {para.replace(/\*\*/g, "")}
                      </h3>
                    );
                  }
                  if (para.startsWith("- ")) {
                    return (
                      <li key={j} className="text-sm ml-4 mb-1">
                        {para.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
                      </li>
                    );
                  }
                  if (/^\d+\./.test(para)) {
                    return (
                      <li key={j} className="text-sm ml-4 mb-1 list-decimal">
                        {para.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                      </li>
                    );
                  }
                  return (
                    <p key={j} className="text-sm leading-relaxed mb-3">
                      {para.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  );
                })}
                <button
                  onClick={() => setExpanded(null)}
                  className="mt-4 text-primary font-semibold text-sm hover:underline"
                >
                  ← Collapse article
                </button>
              </div>
            ) : (
              <button
                onClick={() => setExpanded(post.slug)}
                className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:gap-2.5 transition-all"
              >
                Read full article <ArrowRight className="h-4 w-4" />
              </button>
            )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </StoreLayout>
  );
}
