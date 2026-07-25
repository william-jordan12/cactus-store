import FeaturedCategories from "@/components/FeaturedCategories";
import HeroCarousel from "@/components/HeroCarousel";
import Newsletter from "@/components/Newsletter";
import ReviewsSection from "@/components/ReviewsSection";
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

export default function Home() {
  const searchString = useSearch();
  const urlSearch = useMemo(() => new URLSearchParams(searchString).get("search") ?? "", [searchString]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState(urlSearch);
  const { addItem } = useCart();

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
          {categories && categories.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5">
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
        </div>

        {/* Mobile category filter */}
        {categories && categories.length > 0 && (
          <div className="flex md:hidden flex-wrap gap-1.5 mb-6">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoryId === null
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border"
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
                    : "bg-transparent text-muted-foreground border-border"
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
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setCategoryId(null);
                  window.history.replaceState(null, "", "/");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {products.map(product => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group flex flex-col"
              >
                <div className="aspect-[4/5] bg-muted/40 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    />
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

      <ReviewsSection />

      <Newsletter />
    </StoreLayout>
  );
}
