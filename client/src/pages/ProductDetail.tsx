import StoreLayout from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { ImageOff, Loader2, Minus, Plus, ChevronRight, Truck, ShieldCheck, Leaf } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading, error } = trpc.store.product.useQuery({ id: productId });
  const { data: categories } = trpc.store.categories.useQuery();
  const { data: allProducts } = trpc.store.products.useQuery();

  const images = useMemo(() => {
    if (!product) return [];
    const arr: string[] = [];
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) arr.push(...parsed);
      } catch {}
    }
    if (arr.length === 0 && product.imageUrl) arr.push(product.imageUrl);
    return arr;
  }, [product]);

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

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
    }, quantity);
    toast.success(`${product.title} added to cart`);
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container py-24 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              {formatPrice(product.priceCents)}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mb-6">
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
              <Button
                size="lg"
                className="flex-1 uppercase font-bold tracking-wide text-sm h-11"
                onClick={handleAddToCart}
              >
                Add to Cart
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
            {relatedProducts.map(p => (
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
                  <div className="font-bold text-sm">{formatPrice(p.priceCents)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
