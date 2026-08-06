import StoreLayout from "@/components/StoreLayout";
import { Star } from "lucide-react";
import { useSeo, useJsonLd } from "@/lib/seo";
import { trpc } from "@/lib/trpc";

function formatDate(d: string | Date | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
  const { data: reviews, isLoading } = trpc.store.reviews.useQuery();

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  const distribution = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews?.filter(rev => rev.rating === r).length ?? 0,
    pct: reviews && reviews.length > 0 ? Math.round(((reviews.filter(rev => rev.rating === r).length ?? 0) / reviews.length) * 100) : 0,
  }));

  useJsonLd(
    "reviews",
    reviews && reviews.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Peyote Seeds Farm",
          url: "https://peyoteseedsvault.com",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 10).map(r => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
            },
            author: { "@type": "Person", name: r.authorName },
            datePublished: formatDate(r.createdAt),
            reviewBody: r.content,
          })),
        }
      : null,
  );

  return (
    <StoreLayout>
      <div className="container py-10 md:py-14">
        <h1 className="font-display text-2xl md:text-3xl font-black mb-8">Customer Reviews</h1>

        {isLoading ? (
          <div className="space-y-6 max-w-2xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <p className="text-muted-foreground max-w-2xl">
            No reviews yet. We're collecting reviews from recent customers — check back soon.
          </p>
        ) : (
          <>
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
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3">{review.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{review.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
