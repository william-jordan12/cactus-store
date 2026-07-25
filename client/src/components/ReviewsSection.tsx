import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    location: "Austin, TX",
    rating: 5,
    text: "My Ariocarpus arrived in perfect condition, packed like a little museum piece. It's already plumping up beautifully.",
    product: "Ariocarpus Furfuraceus",
  },
  {
    name: "Yuki T.",
    location: "Tokyo, Japan",
    rating: 5,
    text: "Shipping to Japan was faster than expected — only 10 days. The Astrophytum myriostigma is stunning.",
    product: "Astrophytum Myriostigma",
  },
  {
    name: "Anna S.",
    location: "Berlin, Germany",
    rating: 5,
    text: "The asterias I received is gorgeous — perfect star shape with beautiful white flocking. Exceeded expectations.",
    product: "Astrophytum Asterias",
  },
  {
    name: "Emma R.",
    location: "London, UK",
    rating: 4,
    text: "Ordered three different species and they all arrived healthy. One had a small scar but that's natural for these slow growers.",
    product: "Ariocarpus Collection",
  },
  {
    name: "James W.",
    location: "Sydney, AU",
    rating: 4,
    text: "Plant survived 14 days in transit which is impressive. One root was slightly damaged but recovering well.",
    product: "Lophophora Williamsii Var. Texana",
  },
];

export default function ReviewsSection() {
  return (
    <section id="reviews" className="bg-[oklch(0.97_0.005_155)]">
      <div className="container py-16 md:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">From our customers</p>
            <h2 className="font-display text-2xl md:text-3xl font-black">What collectors say</h2>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-muted-foreground text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">4.6</span>
            <span>average from verified buyers</span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[300px] md:w-[340px] bg-white border border-border rounded-xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`h-3.5 w-3.5 ${j < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <Quote className="h-4 w-4 text-border" />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">
                "{review.text}"
              </p>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">{review.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{review.location}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{review.product}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
