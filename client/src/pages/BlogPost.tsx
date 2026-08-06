import StoreLayout from "@/components/StoreLayout";
import { useSeo, useJsonLd } from "@/lib/seo";
import { getPostBySlug, getRelatedPosts } from "@/lib/blogPosts";
import { Link, useParams } from "wouter";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import NotFound from "@/pages/NotFound";

function renderContent(content: string) {
  return content.split("\n").map((para, j) => {
    if (!para.trim()) return null;
    if (para.startsWith("**") && para.endsWith("**")) {
      return (
        <h3 key={j} className="font-display text-lg font-bold text-foreground mt-6 mb-2">
          {para.replace(/\*\*/g, "")}
        </h3>
      );
    }
    if (para.startsWith("- ")) {
      return (
        <li key={j} className="text-sm ml-4 mb-1">
          {para.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
        </li>
      );
    }
    if (/^\d+\./.test(para)) {
      return (
        <li key={j} className="text-sm ml-4 mb-1 list-decimal">
          {para.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
        </li>
      );
    }
    return (
      <p key={j} className="text-sm leading-relaxed mb-3">
        {para.replace(/\*\*(.*?)\*\*/g, "$1")}
      </p>
    );
  });
}

export default function BlogPost() {
  const { slug } = useParams();
  return <PostView slug={slug ?? ""} />;
}

function PostView({ slug }: { slug: string }) {
  const post = getPostBySlug(slug);

  useSeo({
    title: post ? post.title : "Article Not Found",
    description: post ? post.excerpt : "This article could not be found.",
    canonical: post ? `/blog/${post.slug}` : undefined,
    ogImage: post?.image,
  });

  useJsonLd(
    "blog-article",
    post
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          image: post.image,
          author: { "@type": "Organization", name: "Peyote Seeds Farm" },
          publisher: { "@type": "Organization", name: "Peyote Seeds Farm" },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://peyoteseedsvault.com/blog/${post.slug}`,
          },
        }
      : null,
  );

  useJsonLd(
    "blog-breadcrumb",
    post
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://peyoteseedsvault.com" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://peyoteseedsvault.com/blog" },
            { "@type": "ListItem", position: 3, name: post.title, item: `https://peyoteseedsvault.com/blog/${post.slug}` },
          ],
        }
      : null,
  );

  if (!post) return <NotFound />;

  const related = getRelatedPosts(post.slug);

  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-16">
        <div className="container max-w-3xl">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-4 text-xs text-white/60">
            <span className="bg-white/15 text-white font-semibold px-2.5 py-0.5 rounded-full">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readTime}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-black leading-tight">{post.title}</h1>
        </div>
      </section>

      <section className="container py-12 max-w-3xl">
        <div className="rounded-xl overflow-hidden bg-muted mb-8">
          <img src={post.image} alt={post.title} className="w-full aspect-[3/1] object-cover" />
        </div>

        <article className="prose prose-sm text-muted-foreground max-w-none">
          <p className="text-base text-foreground/90 leading-relaxed mb-6 font-medium">{post.excerpt}</p>
          <ul className="list-disc">{renderContent(post.content)}</ul>
        </article>

        <div className="mt-12 border-t border-border pt-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:gap-2.5 transition-all"
          >
            Browse cactus seeds &amp; plants <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container pb-16 max-w-3xl">
          <h2 className="font-display text-xl font-bold mb-4">Keep Reading</h2>
          <div className="space-y-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{p.category}</span>
                  <span>{p.date}</span>
                </div>
                <h3 className="font-display font-bold text-foreground">{p.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </StoreLayout>
  );
}
