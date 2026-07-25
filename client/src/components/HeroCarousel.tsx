import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

const slides = [
  {
    heading: "Grown with care,\nshipped with discretion",
    body: "Rare cactus species and seeds, cultivated in our greenhouse and delivered worldwide in protective, unmarked packaging.",
    cta: { label: "Browse the collection", href: "#shop" },
    accent: "bg-[oklch(0.22_0.04_155)]",
  },
  {
    heading: "For collectors\nwho know the difference",
    body: "Ariocarpus, Astrophytum, Lophophora — each specimen selected by growers, not algorithms.",
    cta: { label: "See what's available", href: "#shop" },
    accent: "bg-[oklch(0.20_0.035_170)]",
  },
  {
    heading: "Start from seed.\nIt's worth the wait.",
    body: "Germination kits with sterile substrate, humidity control, and the guidance to get your first seedlings established.",
    cta: { label: "Shop kits", href: "#shop" },
    accent: "bg-[oklch(0.24_0.04_145)]",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => { setDirection(1); setCurrent(c => (c + 1) % slides.length); }, []);
  const prev = useCallback(() => { setDirection(-1); setCurrent(c => (c - 1 + slides.length) % slides.length); }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <section
      className={`relative overflow-hidden ${slides[current].accent} transition-colors duration-1000`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Subtle grain overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="container relative py-16 md:py-24 lg:py-32 min-h-[320px] md:min-h-[400px] lg:min-h-[480px] flex items-center">
        <div
          key={current}
          className="max-w-2xl"
          style={{ animation: `fadeSlide${direction > 0 ? 'Right' : 'Left'} 0.6s cubic-bezier(0.16, 1, 0.3, 1)` }}
        >
          <h1 className="font-display text-[2rem] md:text-[2.75rem] lg:text-[3.25rem] font-black text-white leading-[1.1] mb-5 whitespace-pre-line">
            {slides[current].heading}
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
            {slides[current].body}
          </p>
          <a
            href={slides[current].cta.href}
            className="inline-flex items-center gap-2 text-white text-sm font-semibold tracking-wide border-b-2 border-white/40 pb-1 hover:border-white transition-colors"
          >
            {slides[current].cta.label}
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Minimal nav arrows */}
        <button
          onClick={prev}
          className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/50 flex items-center justify-center transition-all"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/50 flex items-center justify-center transition-all"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Slide counter */}
        <div className="absolute bottom-6 right-6 lg:right-8 flex items-center gap-3">
          <span className="text-white/40 text-xs font-medium tabular-nums">
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-[3px] rounded-full transition-all duration-500 ${
                  i === current ? "w-8 bg-white" : "w-3 bg-white/25 hover:bg-white/40"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
