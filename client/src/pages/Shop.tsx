import StoreLayout from "@/components/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, formatPriceRange, parseVariants, variantPriceRange } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { ImageOff, PackageOpen, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSeo } from "@/lib/seo";

function productDisplayPrice(product: { priceCents: number; priceEndCents: number | null; isVariable?: boolean; variants?: string | null }) {
  const isVar = (product as any).isVariable ?? false;
  const variants = parseVariants((product as any).variants);
  if (isVar && variants.length > 0) {
    const range = variantPriceRange(variants);
    if (range) return range[0] === range[1] ? formatPrice(range[0]) : formatPriceRange(range[0], range[1]);
  }
  if (product.priceEndCents && product.priceEndCents > product.priceCents) {
    return formatPriceRange(product.priceCents, product.priceEndCents);
  }
  return formatPrice(product.priceCents);
}

export default function Shop() {
  useSeo({ title: "Shop", description: "Browse our full collection of greenhouse-grown cactus plants and seeds. Filter by category, search by name. Discreet worldwide shipping.", canonical: "/shop" });
  const searchString = useSearch();
  const urlSearch = useMemo(() => new URLSearchParams(searchString).get("search") ?? "", [searchString]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const prefetchProduct = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: trpc.store.product.queryOptions({ id }),
      staleTime: 5 * 60 * 1000,
    });
  };

  const { data: categories } = trpc.store.categories.useQuery();
  const { data: products, isLoading } = trpc.store.products.useQuery({
    categoryId: categoryId ?? undefined,
    search: urlSearch || undefined,
  });

  const handleAdd = (e: React.MouseEvent, product: NonNullable<typeof products>[number]) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.inStock === false) return;
    const isVar = (product as any).isVariable ?? false;
    if (isVar) {
      window.location.href = `/product/${product.id}`;
      return;
    }
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
      <div className="container py-10 md:py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black">
              {urlSearch ? `Results for "${urlSearch}"` : "Shop"}
            </h1>
          </div>
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
              {urlSearch || categoryId ? "Nothing here" : "Coming soon"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {urlSearch || categoryId
                ? "Try a different search or clear your filters."
                : "We're stocking the shelves. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {products.map(product => {
              const isVar = (product as any).isVariable ?? false;
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group flex flex-col"
                  onMouseEnter={() => prefetchProduct(product.id)}
                >
                  <div className="aspect-[4/5] bg-muted/40 rounded-lg overflow-hidden mb-3 flex items-center justify-center relative">
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
                    {isVar && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold uppercase rounded tracking-wide">Variable</span>
                    )}
                    {product.inStock === false && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold uppercase rounded tracking-wide">Out of Stock</span>
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
                      <span className="font-semibold text-sm">
                        {productDisplayPrice(product)}
                      </span>
                      <button
                        onClick={(e) => handleAdd(e, product)}
                        disabled={product.inStock === false}
                        className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                          product.inStock === false
                            ? "border-border/50 text-muted-foreground/30 cursor-not-allowed"
                            : "border-border text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground"
                        }`}
                        aria-label={product.inStock === false ? "Out of stock" : isVar ? `View ${product.title}` : `Add ${product.title} to cart`}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
