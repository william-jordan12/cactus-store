import StoreLayout from "@/components/StoreLayout";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useSeo } from "@/lib/seo";
import { posts } from "@/lib/blogPosts";
import { Link } from "wouter";

export default function Blog() {
  useSeo({ title: "Blog", description: "Growing guides, plant care tips, pest treatment, and sustainability articles from Peyote Seeds Farm.", canonical: "/blog" });

  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">Journal</p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">Blog</h1>
          <p className="text-white/70 text-lg">
            Tips, guides, and stories from our greenhouse to your collection.
          </p>
        </div>
      </section>

      <section className="container py-12 max-w-3xl">
        {posts.map((post, i) => (
          <article
            key={post.slug}
            className={`border-b border-border ${i === 0 ? "pb-10 mb-10" : "py-10"}`}
          >
            <div className="md:flex gap-6">
              {/* Thumbnail */}
              <Link href={`/blog/${post.slug}`} className="md:w-48 md:shrink-0 mb-4 md:mb-0 block">
                <div className="aspect-[3/2] rounded-xl overflow-hidden bg-muted">
                  <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                  <span className="bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readTime}
                  </span>
                </div>

                <h2 className="font-display text-xl md:text-2xl font-bold mb-3 text-foreground">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:gap-2.5 transition-all"
                >
                  Read full article <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </StoreLayout>
  );
}
