import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const reviews = [
  {
    name: "Sarah M.",
    location: "Austin, TX",
    avatar: "SM",
    rating: 5,
    text: "My Ariocarpus arrived in perfect condition, packed like a little museum piece. It's already plumping up beautifully. Best cactus purchase I've ever made online.",
    product: "Ariocarpus Furfuraceus",
  },
  {
    name: "Marco L.",
    location: "Milan, Italy",
    avatar: "ML",
    rating: 5,
    text: "Ordered a mixed seed pack for international delivery. Every single species germinated within a week. The care instructions included were incredibly helpful for a beginner like me.",
    product: "Mixed Cactus Seed Pack",
  },
  {
    name: "David K.",
    location: "Portland, OR",
    avatar: "DK",
    rating: 5,
    text: "I've been collecting for 15 years and this is the most healthy Lophophora I've received by mail. The roots were well-established and the plant was a gorgeous blue-green. Highly recommend.",
    product: "Lophophora Williamsii",
  },
  {
    name: "Yuki T.",
    location: "Tokyo, Japan",
    label: "Verified Buyer",
    avatar: "YT",
    rating: 5,
    text: "Shipping to Japan was faster than expected — only 10 days! The packaging was discreet and professional. The Astrophytum myriostigma is stunning. Will order again.",
    product: "Astrophytum Myriostigma",
  },
  {
    name: "Emma R.",
    location: "London, UK",
    avatar: "ER",
    rating: 4,
    text: "Beautiful collection of Ariocarpus. I ordered three different species and they all arrived healthy. One had a small scar but that's natural for these slow growers. Very happy overall.",
    product: "Ariocarpus Collection",
  },
  {
    name: "Carlos P.",
    location: "Mexico City, MX",
    avatar: "CP",
    rating: 5,
    text: "Finally found a reliable source for genuine Lophophora seeds. Germination rate was excellent and the seeds arrived fresh. The team clearly knows their stuff about these species.",
    product: "Lophophora Seeds",
  },
  {
    name: "Anna S.",
    location: "Berlin, Germany",
    avatar: "AS",
    rating: 5,
    text: "The Astrophytum asterias I received is absolutely gorgeous — a perfect star shape with beautiful white flocking. Arrived in a custom pot with drainage. Exceeded all expectations.",
    product: "Astrophytum Asterias",
  },
  {
    name: "James W.",
    location: "Sydney, Australia",
    avatar: "JW",
    rating: 5,
    text: "I was skeptical about ordering live plants overseas but the packaging was military-grade. My Lophophora Williamsii var. texana arrived after 14 days looking like it was just unpotted. Impressed.",
    product: "Lophophora Williamsii Var. Texana",
  },
];

function ReviewCard({ review, index }: { review: typeof reviews[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const colors = [
    "bg-emerald-600",
    "bg-amber-600",
    "bg-sky-600",
    "bg-rose-600",
    "bg-violet-600",
    "bg-teal-600",
    "bg-orange-600",
    "bg-indigo-600",
  ];

  return (
    <div
      ref={ref}
      className={`bg-white border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${colors[index % colors.length]} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
          {review.avatar}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{review.name}</div>
          <div className="text-xs text-muted-foreground">{review.location}</div>
        </div>
        <div className="ml-auto flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted/40"}`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
      <div className="mt-auto pt-1">
        <span className="text-[11px] uppercase tracking-wide text-primary font-semibold">
          {review.product}
        </span>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="bg-[oklch(0.97_0.01_140)] border-t border-border"
    >
      <div className="container py-16">
        <div
          className={`text-center mb-10 transition-all duration-700 ease-out ${
            sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-primary uppercase tracking-[0.25em] text-xs font-bold mb-2">
            What Collectors Say
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-black mb-2">
            Trusted by Plant Lovers Worldwide
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Real reviews from our customers across 40+ countries
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
