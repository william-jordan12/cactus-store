import ReviewsSection from "@/components/ReviewsSection";
import StoreLayout from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { ImageOff, Leaf, PackageOpen, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

const HERO_IMAGE = "/manus-storage/hero-cactus_190fb540.jpg";

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-[oklch(0.22_0.04_155)]">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.18_0.03_155)]/90 to-transparent" />
        <div className="container relative py-20 md:py-28 max-w-none">
          <div className="max-w-xl">
            <p className="text-white/70 uppercase tracking-[0.25em] text-xs font-bold mb-3">
              Greenhouse grown · Ethically sourced
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-black text-white leading-tight mb-4">
              Authentic Cactus Plants &amp; Seeds
            </h1>
            <p className="text-white/80 mb-6 md:text-lg">
              Fresh, viable seeds and healthy plants with discreet worldwide shipping and secure checkout.
            </p>
            <Button
              size="lg"
              className="uppercase font-bold tracking-wide"
              onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}
            >
              Shop Now
            </Button>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-secondary/60">
        <div className="container grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 text-sm">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary shrink-0" />
            <span><strong>Discreet shipping</strong> — worldwide delivery</span>
          </div>
          <div className="flex items-center gap-3">
            <Leaf className="h-6 w-6 text-primary shrink-0" />
            <span><strong>Ethically propagated</strong> — never wild-harvested</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
            <span><strong>Secure checkout</strong> — WhatsApp or card</span>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="shop" className="container py-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-px flex-1 bg-border" />
          <h2 className="font-display text-2xl font-black uppercase tracking-wide text-center">
            {search ? `Results for "${search}"` : "Our Products"}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Browse the catalog{categories && categories.length > 0 ? " or filter by category" : ""}
        </p>

        {/* Category filter tabs */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                categoryId === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-foreground/70 border-border hover:border-primary hover:text-primary"
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id === categoryId ? null : cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  categoryId === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-foreground/70 border-border hover:border-primary hover:text-primary"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-md mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">
              {search || categoryId ? "No products match your filters" : "Our shelves are being stocked"}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {search || categoryId
                ? "Try a different search term or category."
                : "New products are coming soon. Please check back shortly!"}
            </p>
            {(search || categoryId) && (
              <Button
                variant="outline"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div
                key={product.id}
                className="group bg-white border border-border rounded-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-muted/50 overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageOff className="h-10 w-10 text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 text-center">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    {categoryName(product.categoryId) || "Uncategorized"}
                  </div>
                  <h3 className="font-semibold text-primary text-sm leading-snug mb-1 line-clamp-2">
                    {product.title}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                  )}
                  <div className="font-bold text-foreground mb-3 mt-auto">{formatPrice(product.priceCents)}</div>
                  <Button
                    size="sm"
                    className="uppercase text-xs font-bold tracking-wide w-full"
                    onClick={() => handleAdd(product)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ReviewsSection />
    </StoreLayout>
  );
}
