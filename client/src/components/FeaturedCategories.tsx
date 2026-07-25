import { trpc } from "@/lib/trpc";
import { Package } from "lucide-react";
import { Link } from "wouter";

export default function FeaturedCategories() {
  const { data: categories, isLoading } = trpc.store.categories.useQuery();

  if (isLoading || !categories || categories.length === 0) return null;

  return (
    <section className="container py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-px flex-1 bg-border" />
        <h2 className="font-display text-2xl font-black uppercase tracking-wide text-center">
          Shop by Category
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <p className="text-center text-muted-foreground text-sm mb-8">
        Browse our curated selection of cacti and supplies
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/?category=${cat.id}`}
            className="group flex flex-col items-center gap-3 bg-white border border-border rounded-xl p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300"
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <span className="font-semibold text-sm group-hover:text-primary transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
