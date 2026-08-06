import StoreLayout from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, formatPriceRange, parseVariants, variantPriceRange } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import type { ProductVariant } from "../../../../shared/types";
import { ImageOff, Minus, Plus, ChevronRight, Truck, ShieldCheck, Leaf, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useSeo, useJsonLd } from "@/lib/seo";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { data: product, isLoading, error } = trpc.store.product.useQuery({ id: productId });
  const { data: categories } = trpc.store.categories.useQuery();
  const { data: allProducts } = trpc.store.products.useQuery();

  useSeo({
    title: product?.title ?? "Product",
    description: product?.description?.slice(0, 160) ?? "View this product on Peyote Seeds Farm. Greenhouse-grown, discreet worldwide shipping.",
    canonical: `/product/${productId}`,
    ogImage: product?.imageUrl ?? undefined,
  });

  const variants = useMemo(() => {
    if (!product) return [];
    return parseVariants((product as any).variants);
  }, [product]);

  const isVariable = (product as any)?.isVariable ?? false;

  const images = useMemo(() => {
    if (!product) return [];
    const arr: string[] = [];
    if (isVariable && selectedVariant?.imageUrl) {
      arr.push(selectedVariant.imageUrl);
    }
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) arr.push(...parsed);
      } catch {}
    }
    if (arr.length === 0 && product.imageUrl) arr.push(product.imageUrl);
    return arr;
  }, [product, isVariable, selectedVariant]);

  const categoryName = useMemo(() => {
    if (!product?.categoryId || !categories) return null;
    return categories.find(c => c.id === product.categoryId)?.name ?? null;
  }, [product, categories]);

  const relatedProducts = useMemo(() => {
    if (!allProducts || !product) return [];
    return allProducts
      .filter(p => p.id !== product.id && (p.categoryId === product.categoryId || !product.categoryId))
      .slice(0, 4);
  }, [allProducts, product]);

  const priceRange = useMemo(() => {
    if (!product) return null;
    if (isVariable && variants.length > 0) {
      return variantPriceRange(variants);
    }
    if (product.priceEndCents && product.priceEndCents > product.priceCents) {
      return [product.priceCents, product.priceEndCents] as [number, number];
    }
    return null;
  }, [product, isVariable, variants]);

  const displayPriceText = useMemo(() => {
    if (!product) return "";
    if (isVariable && variants.length > 0) {
      const range = variantPriceRange(variants);
      if (range) return range[0] === range[1] ? formatPrice(range[0]) : formatPriceRange(range[0], range[1]);
    }
    if (product.priceEndCents && product.priceEndCents > product.priceCents) {
      return formatPriceRange(product.priceCents, product.priceEndCents);
    }
    return formatPrice(product.priceCents);
  }, [product, isVariable, variants]);

  // Representative single price (lowest) used for structured data.
  const displayPriceCents = useMemo(() => {
    if (isVariable && variants.length > 0) {
      return Math.min(...variants.map(v => v.priceCents));
    }
    return product?.priceCents ?? 0;
  }, [product, isVariable, variants]);

  // Product rich-result schema (price, availability, images) + breadcrumbs.
  useJsonLd("product", product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: `psf-${product.id}`,
    description: product.description ?? product.title,
    category: categoryName ?? "Cactus Plants & Seeds",
    brand: { "@type": "Brand", name: "Peyote Seeds Farm" },
    image: images.length > 0 ? images : [product.imageUrl].filter(Boolean),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (displayPriceCents / 100).toFixed(2),
      availability: product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `https://peyoteseedsvault.com/product/${product.id}`,
      itemCondition: "https://schema.org/NewCondition",
    },
  } : null);

  useJsonLd("breadcrumb", product ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://peyoteseedsvault.com/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "https://peyoteseedsvault.com/shop" },
      ...(categoryName
        ? [{ "@type": "ListItem", position: 3, name: categoryName, item: "https://peyoteseedsvault.com/shop" }]
        : []),
      {
        "@type": "ListItem",
        position: categoryName ? 4 : 3,
        name: product.title,
        item: `https://peyoteseedsvault.com/product/${product.id}`,
      },
    ],
  } : null);

  const handleAddToCart = () => {
    if (!product) return;
    if (isVariable && !selectedVariant) {
      toast.error("Please select a variant first");
      return;
    }
    const price = isVariable && selectedVariant ? selectedVariant.priceCents : product.priceCents;
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      priceCents: price,
      variantName: isVariable && selectedVariant ? selectedVariant.name : undefined,
    }, quantity);
    toast.success(`${product.title}${isVariable && selectedVariant ? ` (${selectedVariant.name})` : ""} added to cart`);
  };

  // Auto-select first variant on load
  const autoSelectedRef = useMemo(() => {
    if (isVariable && variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
      return true;
    }
    return false;
  }, [isVariable, variants, selectedVariant]);

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
            <div>
              <div className="aspect-square bg-muted rounded-xl" />
              <div className="flex gap-2 mt-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 w-16 rounded-lg bg-muted" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/3 mt-2" />
              <div className="space-y-2 mt-4">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="h-11 w-28 bg-muted rounded-lg" />
                <div className="h-11 flex-1 bg-muted rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (error || !product) {
    return (
      <StoreLayout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-black mb-2">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="uppercase font-bold tracking-wide">Back to Shop</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const currentImage = images[activeImage] ?? product.imageUrl;

  return (
    <StoreLayout>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/#shop" className="hover:text-primary transition-colors">Shop</Link>
          {categoryName && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{categoryName}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      {/* Product section */}
      <section className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div>
            <div className="bg-muted/50 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-border mb-3">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageOff className="h-20 w-20 text-muted-foreground/30" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            {categoryName && (
              <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">
                {categoryName}
              </div>
            )}
            <h1 className="font-display text-2xl lg:text-3xl font-black text-foreground mb-4">
              {product.title}
            </h1>

            <div className="text-3xl font-bold text-foreground mb-6">
              {displayPriceText}
            </div>

            {product.inStock === false && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm font-medium mb-4 w-fit">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Out of Stock
              </div>
            )}

            {/* Variant selector */}
            {isVariable && variants.length > 0 && (
              <div className="mb-6">
                <Label className="text-sm font-semibold mb-2 block">Select Variant</Label>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        setActiveImage(0);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        selectedVariant?.id === v.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      {v.imageUrl && (
                        <img src={v.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{v.name}</div>
                        <div className="text-xs opacity-70">{formatPrice(v.priceCents)}</div>
                      </div>
                      {selectedVariant?.id === v.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mb-6">
              {product.inStock !== false && (
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="h-11 w-11 flex items-center justify-center text-foreground/70 hover:bg-muted transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="h-11 w-12 flex items-center justify-center font-semibold text-sm border-x border-border">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(99, q + 1))}
                    className="h-11 w-11 flex items-center justify-center text-foreground/70 hover:bg-muted transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Button
                size="lg"
                className={`flex-1 uppercase font-bold tracking-wide text-sm h-11 ${
                  product.inStock === false ? "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted" : ""
                }`}
                onClick={handleAddToCart}
                disabled={product.inStock === false}
              >
                {product.inStock === false ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>

            {/* Trust signals */}
            <div className="border-t border-border pt-5 mt-auto space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 text-primary shrink-0" />
                <span>Discreet worldwide shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Leaf className="h-4 w-4 text-primary shrink-0" />
                <span>Ethically propagated, never wild-harvested</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Secure checkout &amp; privacy protection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="container pb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-border" />
            <h2 className="font-display text-xl font-black uppercase tracking-wide">Related Products</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(p => {
              const pVariants = parseVariants((p as any).variants);
              const pIsVar = (p as any).isVariable ?? false;
              const pRange = pIsVar && pVariants.length > 0 ? variantPriceRange(pVariants) : null;
              const pPrice = pRange
                ? (pRange[0] === pRange[1] ? formatPrice(pRange[0]) : formatPriceRange(pRange[0], pRange[1]))
                : (p.priceEndCents && p.priceEndCents > p.priceCents ? formatPriceRange(p.priceCents, p.priceEndCents) : formatPrice(p.priceCents));
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group bg-white border border-border rounded-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-muted/50 overflow-hidden flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-semibold text-xs leading-snug mb-1 line-clamp-2">{p.title}</h3>
                    <div className="font-bold text-sm">{pPrice}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
