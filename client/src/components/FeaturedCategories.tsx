import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function FeaturedCategories() {
  const { data: categories, isLoading } = trpc.store.categories.useQuery();

  if (isLoading || !categories || categories.length === 0) return null;

  return (
    <section className="container py-12 md:py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">Browse by type</p>
          <h2 className="font-display text-2xl md:text-3xl font-black">Categories</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/?category=${cat.id}`}
            className="group relative overflow-hidden rounded-lg bg-[oklch(0.96_0.008_155)] border border-border/60 p-5 text-center hover:border-primary/30 hover:shadow-md transition-all duration-300"
          >
            <span className="font-semibold text-sm group-hover:text-primary transition-colors">
              {cat.name}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1 group-hover:text-primary/60 transition-colors">
              View all
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
