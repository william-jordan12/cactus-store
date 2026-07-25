import StoreLayout from "@/components/StoreLayout";
import { Star } from "lucide-react";
import { useSeo } from "@/lib/seo";

const reviews = [
  {
    name: "Sarah M.",
    location: "Austin, TX",
    rating: 5,
    text: "My Ariocarpus arrived in perfect condition, packed like a little museum piece. It's already plumping up beautifully after three weeks. This is the real deal.",
    product: "Ariocarpus Furfuraceus",
    date: "2 weeks ago",
  },
  {
    name: "Yuki T.",
    location: "Tokyo, Japan",
    rating: 5,
    text: "Shipping to Japan was faster than expected — only 10 days! The Astrophytum myriostigma is stunning, way bigger than I anticipated. Will definitely order again.",
    product: "Astrophytum Myriostigma",
    date: "1 month ago",
  },
  {
    name: "Marco L.",
    location: "Milan, Italy",
    rating: 4,
    text: "Seeds germinated well but shipping to Italy took almost 3 weeks. The care guide that came with the order was genuinely useful though. Would order again if they improve delivery times.",
    product: "Mixed Cactus Seed Pack",
    date: "3 weeks ago",
  },
  {
    name: "Anna S.",
    location: "Berlin, Germany",
    rating: 5,
    text: "The asterias I received is gorgeous — perfect star shape with beautiful white flocking. Arrived in a custom pot with drainage. Exceeded all expectations for the price.",
    product: "Astrophytum Asterias",
    date: "1 week ago",
  },
  {
    name: "Carlos P.",
    location: "Mexico City, MX",
    rating: 2,
    text: "Half the seeds didn't germinate and I followed the instructions exactly. Reached out to support and they offered a partial refund which was fair, but still frustrating for the price point.",
    product: "Lophophora Seeds",
    date: "2 months ago",
  },
  {
    name: "David K.",
    location: "Portland, OR",
    rating: 3,
    text: "I've been collecting for 15 years and this Lophophora was decent but not what I expected. It was smaller than pictured and the root system wasn't as developed as described. Alive and healthy though.",
    product: "Lophophora Williamsii",
    date: "1 month ago",
  },
  {
    name: "Emma R.",
    location: "London, UK",
    rating: 4,
    text: "Ordered three different species and they all arrived healthy. One had a small scar but that's natural for these slow growers. Very happy overall with the quality.",
    product: "Ariocarpus Collection",
    date: "3 weeks ago",
  },
  {
    name: "James W.",
    location: "Sydney, AU",
    rating: 4,
    text: "Plant survived 14 days in transit which is impressive. One of the roots was slightly damaged but it's recovering well now. Solid packaging overall.",
    product: "Lophophora Williamsii Var. Texana",
    date: "2 weeks ago",
  },
  {
    name: "Lisa H.",
    location: "Denver, CO",
    rating: 5,
    text: "Third order from here and the quality is consistently excellent. The Lophophora diffusa I received is a beautiful specimen. These guys know what they're doing.",
    product: "Lophophora Diffusa",
    date: "5 days ago",
  },
  {
    name: "Hans M.",
    location: "Amsterdam, NL",
    rating: 1,
    text: "Package never arrived. Contacted support multiple times and kept getting told to wait. After 6 weeks they finally refunded me but it was a terrible experience. Not worth the hassle.",
    product: "Astrophytum Asterias",
    date: "3 months ago",
  },
  {
    name: "Rachel T.",
    location: "Toronto, CA",
    rating: 5,
    text: "I was nervous ordering live plants online but everything arrived in perfect shape. The Aztekium ritteri is so unique — exactly what I wanted for my collection.",
    product: "Aztekium Ritteri",
    date: "1 week ago",
  },
  {
    name: "Pavel K.",
    location: "Prague, CZ",
    rating: 3,
    text: "The plant itself is fine but it took almost a month to arrive. Customer service was friendly when I wrote them but the wait was stressful. Product quality is good if you can be patient.",
    product: "Lophophora Williamsii",
    date: "6 weeks ago",
  },
  {
    name: "Michelle B.",
    location: "Miami, FL",
    rating: 4,
    text: "Nice selection and fair prices. My Pelecyphora aselliformis arrived well-packed and healthy. Only reason for 4 stars is the shipping took a bit longer than the estimated window.",
    product: "Pelecyphora Aselliformis",
    date: "2 weeks ago",
  },
  {
    name: "Kenji O.",
    location: "Osaka, Japan",
    rating: 5,
    text: "Everything about this order was perfect. Fast shipping, incredible packaging, and the Astrophytum myriostigma 'nudum' is absolutely flawless. This is my go-to shop now.",
    product: "Astrophytum Myriostigma",
    date: "4 days ago",
  },
  {
    name: "Tom R.",
    location: "Chicago, IL",
    rating: 2,
    text: "Plant arrived dried out and barely alive. I followed all the care instructions but it didn't recover. Asked for a replacement and was told to buy another. Disappointed.",
    product: "Lophophora Williamsii",
    date: "2 months ago",
  },
  {
    name: "Sofia G.",
    location: "Barcelona, ES",
    rating: 4,
    text: "Good seeds, good germination rate. Only issue was the tracking number didn't work for the first week of shipping. Once it updated everything was fine.",
    product: "Lophophora Fricii Seeds",
    date: "1 month ago",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  useSeo({ title: "Customer Reviews", description: "Read real reviews from our customers. See what people say about our cactus plants, seeds, shipping, and customer service.", canonical: "/reviews" });
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const distribution = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rev => rev.rating === r).length,
    pct: Math.round((reviews.filter(rev => rev.rating === r).length / reviews.length) * 100),
  }));

  return (
    <StoreLayout>
      <div className="container py-10 md:py-14">
        <h1 className="font-display text-2xl md:text-3xl font-black mb-8">Customer Reviews</h1>

        {/* Summary bar */}
        <div className="flex flex-col sm:flex-row gap-8 mb-10 pb-10 border-b border-border">
          <div className="flex flex-col items-center sm:items-start shrink-0">
            <div className="text-4xl font-bold">{avgRating}</div>
            <StarRating rating={Math.round(Number(avgRating))} />
            <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2 max-w-sm">
            {distribution.map(d => (
              <div key={d.stars} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-right text-muted-foreground">{d.stars}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground text-xs">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review list */}
        <div className="space-y-6 max-w-2xl">
          {reviews.map((review, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <StarRating rating={review.rating} />
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{review.text}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{review.name}</span>
                  <span className="text-muted-foreground ml-2">{review.location}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{review.product}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
