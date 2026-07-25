import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

const slides = [
  {
    heading: "Authentic Cactus Plants & Seeds",
    tagline: "Greenhouse grown · Ethically sourced",
    body: "Fresh, viable seeds and healthy plants with discreet worldwide shipping and secure checkout.",
    cta: { label: "Shop Now", href: "#shop" },
    bg: "bg-[oklch(0.22_0.04_155)]",
  },
  {
    heading: "Rare Succulents for Collectors",
    tagline: "Curated by enthusiasts",
    body: "From Ariocarpus to Astrophytum — discover hard-to-find species cultivated with care in our greenhouse.",
    cta: { label: "Explore Collection", href: "#shop" },
    bg: "bg-[oklch(0.20_0.035_170)]",
  },
  {
    heading: "Germination Kits & Tools",
    tagline: "Everything you need to start",
    body: "Sterile soil mix, humidity domes, and expert instructions included. Perfect for beginners and growers alike.",
    cta: { label: "View Kits", href: "#shop" },
    bg: "bg-[oklch(0.24_0.04_145)]",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <section
      className={`relative overflow-hidden ${slides[current].bg} transition-colors duration-700`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container relative py-20 md:py-28 max-w-none min-h-[340px] md:min-h-[420px] flex items-center">
        {/* Slide content */}
        <div key={current} className="max-w-xl animate-in fade-in slide-in-from-left-4 duration-500">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">
            {slides[current].tagline}
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-black text-white leading-tight mb-4">
            {slides[current].heading}
          </h1>
          <p className="text-white/80 mb-6 md:text-lg">
            {slides[current].body}
          </p>
          <a
            href={slides[current].cta.href}
            className="inline-block bg-white text-[oklch(0.22_0.04_155)] font-bold uppercase tracking-wide px-8 py-3 rounded-md hover:bg-white/90 transition-colors text-sm"
          >
            {slides[current].cta.label}
          </a>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
