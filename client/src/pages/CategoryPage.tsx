import StoreLayout from "@/components/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, formatPriceRange, parseVariants, variantPriceRange } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { useSeo, useJsonLd } from "@/lib/seo";
import { ImageOff, PackageOpen, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { slugifyName } from "@/lib/slugify";

interface CategoryCopy {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

const curatedCopy: Record<string, CategoryCopy> = {
  "astrophytum-cactus-plants": {
    title: "Astrophytum Cactus Plants & Seeds",
    intro:
      "Astrophytum — the star cactus family — is one of the most collectible and rewarding cactus genera for growers of every level. Ribbed, speckled, and free of heavy spines, these plants are as distinctive as they are easy to admire.",
    sections: [
      {
        heading: "Why Collectors Love Astrophytum",
        body: "From the classic A. myriostigma (Bishop's Cap) to the heavily flecked A. asterias and the horned A. capricorne, Astrophytum species are famous for their symmetrical ribbing, woolly flecks, and large, showy flowers that appear in spring and summer. They stay compact for years, making them ideal for windowsill collections.",
      },
      {
        heading: "Growing Astrophytum From Seed",
        body: "Astrophytum seeds germinate reliably in 1–4 weeks in warm, humid conditions. Use a gritty, well-draining soil, keep seedlings under a humidity dome at 25–28°C, and provide bright, indirect light. Plants grow slowly and can begin flowering at just 2–3 years old.",
      },
      {
        heading: "Care Basics",
        body: "Astrophytum need strong light but not scorching afternoon sun, water only when the soil is completely dry, and a cool, dry winter rest to encourage flowering. A deep pot suits their long taproots — repot every 2–3 years into fresh mineral-rich soil.",
      },
    ],
  },
  "cactus-accessories-soils-and-tools": {
    title: "Cactus Accessories, Soils & Tools",
    intro:
      "Healthy roots start with the right substrate and the right kit. Shop our range of cactus soils, accessories, and tools built for desert plants — not generic potting mix.",
    sections: [
      {
        heading: "Why Cactus Soil Matters",
        body: "Cacti evolved in gritty, fast-draining soils. A proper mix of mineral grit and a little organic matter prevents the root rot that kills most potted cacti. Always choose a specialist mix and repot new plants soon after they arrive.",
      },
      {
        heading: "The Right Tools for the Job",
        body: "From spray misters for seedlings to long-handled tongs for repotting spiny specimens, the right tools make cactus care safer and easier. Look for tools sized for small plants and delicate root work.",
      },
    ],
  },
  "germination-kit": {
    title: "Cactus Germination Kit — Start Seeds the Right Way",
    intro:
      "A complete germination kit takes the guesswork out of growing cacti from seed. Everything needed to sow, germinate, and raise healthy seedlings — all in one box.",
    sections: [
      {
        heading: "What a Good Kit Includes",
        body: "The essentials are a well-draining soil mix, a container with drainage, a clear humidity dome or cover, and a spray bottle for misting. Kits remove the need to buy components separately and give beginners a reliable starting point.",
      },
      {
        heading: "How to Use Your Kit",
        body: "Fill the container with pre-moistened soil, scatter seeds on the surface without burying them, mist, and cover with the dome. Keep the tray at 25–28°C with bright, indirect light, opening the dome every few days for airflow. Expect germination within 1–4 weeks for most species.",
      },
    ],
  },
  "grafting-plants": {
    title: "Grafting Plants & Cactus Rootstocks",
    intro:
      "Grafting is a time-honored technique used to grow slow or sensitive cacti on vigorous rootstocks. Explore plants and rootstocks suited to this approach.",
    sections: [
      {
        heading: "Why Graft Cacti?",
        body: "Grafting speeds up growth for notoriously slow species, rescues plants with damaged root systems, and is used to establish seed-grown seedlings and mutations. A compatible, healthy rootstock provides stronger roots and faster growth.",
      },
      {
        heading: "Grafting Basics",
        body: "Make a clean, flat cut on both scion and stock, align the vascular rings, and hold them together under firm, even pressure until the union heals. Keep the grafted plant out of direct sun and mist-free for the first week or two while the wound calluses.",
      },
    ],
  },
};

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

export default function CategoryPage() {
  const { slug } = useParams();
  const [search, setSearch] = useState("");
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const { data: categories, isLoading: loadingCats } = trpc.store.categories.useQuery();
  const category = categories?.find((c) => slugifyName(c.name) === slug);

  const categoryId = category?.id;
  const { data: products, isLoading } = trpc.store.products.useQuery(
    { categoryId: categoryId ?? undefined, search: search || undefined },
    { enabled: !!categoryId },
  );

  const copy: CategoryCopy | undefined = category ? curatedCopy[slugifyName(category.name)] : undefined;

  useSeo({
    title: category ? (copy?.title ?? `${category.name} | Rare Cactus & Seeds`) : "Category Not Found",
    description: category
      ? (copy?.intro ?? `Shop ${category.name} at Peyote Seeds Farm — greenhouse-grown, ethically propagated, with discreet worldwide shipping.`)
      : "This category could not be found.",
    canonical: category ? `/shop/category/${slugifyName(category.name)}` : undefined,
  });

  useJsonLd(
    "category-breadcrumb",
    category
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://cactus-store-9zio.onrender.com" },
            { "@type": "ListItem", position: 2, name: "Shop", item: "https://cactus-store-9zio.onrender.com/shop" },
            { "@type": "ListItem", position: 3, name: category.name, item: `https://cactus-store-9zio.onrender.com/shop/category/${slugifyName(category.name)}` },
          ],
        }
      : null,
  );

  const prefetchProduct = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: trpc.store.product.queryOptions({ id }),
      staleTime: 5 * 60 * 1000,
    });
  };

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

  const filtered = useMemo(
    () => (products ?? []).filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  if (!loadingCats && !category) {
    return (
      <StoreLayout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-black mb-2">Category not found</h1>
          <Link href="/shop" className="text-primary font-medium text-sm hover:underline">← Back to Shop</Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-14">
        <div className="container max-w-4xl">
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-4 transition-colors">
            ← Back to Shop
          </Link>
          <h1 className="font-display text-2xl md:text-4xl font-black mb-3">
            {category?.name ?? "Loading…"}
          </h1>
          {copy && <p className="text-white/70 text-base md:text-lg max-w-3xl">{copy.intro}</p>}
        </div>
      </section>

      <section className="container py-10">
        {copy && (
          <div className="max-w-3xl mb-10 space-y-6">
            {copy.sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-display text-lg font-bold mb-1.5">{s.heading}</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${category?.name ?? "category"}…`}
            className="w-full max-w-sm rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-bold mb-1">{search ? "No matches" : "Nothing here yet"}</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {search ? "Try a different search term." : "We're stocking the shelves. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {filtered.map((product) => {
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
                    {product.inStock === false && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold uppercase rounded tracking-wide">Out of Stock</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-medium text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-semibold text-sm">{productDisplayPrice(product)}</span>
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
      </section>
    </StoreLayout>
  );
}
