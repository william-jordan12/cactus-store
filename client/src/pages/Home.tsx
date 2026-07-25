import FeaturedCategories from "@/components/FeaturedCategories";
import HeroCarousel from "@/components/HeroCarousel";
import Newsletter from "@/components/Newsletter";
import StoreLayout from "@/components/StoreLayout";
import WhyChooseUs from "@/components/WhyChooseUs";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { ImageOff, PackageOpen, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const searchString = useSearch();
  const urlSearch = useMemo(() => new URLSearchParams(searchString).get("search") ?? "", [searchString]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState(urlSearch);
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const prefetchProduct = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: trpc.store.product.queryOptions({ id }),
      staleTime: 5 * 60 * 1000,
    });
  };

  useEffect(() => {
    setSearch(urlSearch);
    if (urlSearch) {
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [urlSearch]);

  const { data: categories } = trpc.store.categories.useQuery();
  const { data: products, isLoading } = trpc.store.products.useQuery({
    categoryId: categoryId ?? undefined,
    search: search || undefined,
  });

  const handleAdd = (product: NonNullable<typeof products>[number]) => {
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
    });
    toast.success(`"${product.title}" added to cart`);
  };

  const categoryName = (id: number | null) =>
    categories?.find(c => c.id === id)?.name ?? "";

  return (
    <StoreLayout>
      <HeroCarousel />

      <WhyChooseUs />

      <FeaturedCategories />

      {/* Products */}
      <section id="shop" className="container py-10 md:py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">
              {search ? `Results for "${search}"` : "Our collection"}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-black">
              {search ? "Search results" : "Shop"}
            </h2>
          </div>
          <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium hidden md:block">
            View all →
          </Link>
        </div>

        {/* Category filter */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoryId === null
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id === categoryId ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  categoryId === cat.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-muted rounded-lg mb-3" />
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-bold mb-1">
              {search || categoryId ? "Nothing here" : "Coming soon"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {search || categoryId
                ? "Try a different search or clear your filters."
                : "We're stocking the shelves. Check back soon."}
            </p>
            {(search || categoryId) && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setCategoryId(null); window.history.replaceState(null, "", "/"); }}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {products.map(product => (
              <Link key={product.id} href={`/product/${product.id}`} className="group flex flex-col" onMouseEnter={() => prefetchProduct(product.id)}>
                <div className="aspect-[4/5] bg-muted/40 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
                  ) : (
                    <ImageOff className="h-8 w-8 text-muted-foreground/20" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                    {categoryName(product.categoryId) || "Uncategorized"}
                  </p>
                  <h3 className="font-medium text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-semibold text-sm">{formatPrice(product.priceCents)}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(product); }}
                      className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all"
                      aria-label={`Add ${product.title} to cart`}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Editorial content */}
      <section className="border-t border-border">
        <div className="container py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-black mb-6">
              About Our Collection
            </h2>
            <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-4">
              <p>
                Every plant and seed in our catalog is sourced from trusted greenhouse growers
                who propagate under controlled conditions — never pulled from the wild.
              </p>
              <p>
                Whether you've been collecting Ariocarpus and Astrophytum for years or you're starting
                your first Lophophora from seed, every order is inspected before it ships. Plants go
                out bare-root in moisture-controlled wrapping, and seeds ship in sterile envelopes
                with germination instructions.
              </p>
              <p>
                We grow most of what we sell, and the rest comes from growers we know personally. If
                you need help with substrate, light, or dormancy schedules — reach out. We'd rather
                help you keep a plant alive than sell you another one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Growing guide excerpt */}
      <section className="bg-[oklch(0.97_0.005_155)] border-y border-border">
        <div className="container py-14 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">Growing tips</p>
              <h2 className="font-display text-2xl md:text-3xl font-black mb-4">
                Starting cacti from seed
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Growing from seed is the most rewarding way to build a collection. It's also the most
                forgiving for beginners — you get to watch every stage of development, and seedlings
                are surprisingly resilient if you get the basics right.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Use a sterile, well-draining mineral substrate. Keep humidity between 70–80% for the
                first few months using a dome or covered tray. Provide bright indirect light and
                temperatures around 25–28°C. Water from below to avoid disturbing seedlings. Most
                species germinate within 7–14 days under these conditions.
              </p>
            </div>
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">Care guide</p>
              <h2 className="font-display text-2xl md:text-3xl font-black mb-4">
                Mature plant care
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Once established, most desert cacti are among the lowest-maintenance plants you can
                grow. The hard part is not overwatering. Let the soil dry completely between
                waterings — during winter dormancy, some species can go months without a drop.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Provide maximum sunlight. South-facing windowsills or grow lights with 6+ hours of
                direct exposure will keep plants compact and healthy. In summer, outdoor placement
                on a shaded balcony works well. Good airflow prevents fungal issues, especially in
                humid climates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legality section */}
      <section className="container py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">Good to know</p>
          <h2 className="font-display text-2xl md:text-3xl font-black mb-6">
            Legality &amp; responsible growing
          </h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-4">
            <p>
              Most cactus seeds and non-drug-containing species are legal to own, buy, and sell in
              most jurisdictions. Species like Astrophytum, Ariocarpus, and many Lophophora varieties
              are widely available to collectors without restriction.
            </p>
            <p>
              We recommend checking your local regulations before ordering. Responsible cultivation
              means respecting both the law and the ecological significance of these plants. Every species we offer is greenhouse-propagated,
              never wild-collected.
            </p>
          </div>
        </div>
      </section>

      <Newsletter />
    </StoreLayout>
  );
}
