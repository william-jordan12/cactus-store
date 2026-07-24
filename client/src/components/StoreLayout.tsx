import { useAuth } from "@/_core/hooks/useAuth";
import AdminBar from "@/components/AdminBar";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { Mail, Search, ShoppingCart, Sprout } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { itemCount, totalCents } = useCart();
  const { data: settings } = trpc.store.settings.useQuery();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const isAdmin = isAuthenticated && user?.role === "admin";
  const storeName = settings?.storeName || "Peyote Seeds Farm";

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isAdmin ? "pt-8" : ""}`}>
      <AdminBar />

      {/* Announcement bar */}
      <div className="bg-[oklch(0.35_0.09_140)] text-white text-xs tracking-wide">
        <div className="container flex items-center justify-between h-8">
          <span className="font-semibold uppercase">Discreet worldwide shipping | 100% genuine seeds</span>
          <span className="hidden sm:flex items-center gap-1.5">
            {settings?.contactEmail ? (
              <>
                <Mail className="h-3 w-3" />
                {settings.contactEmail}
              </>
            ) : null}
          </span>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-border">
        <div className="container flex items-center gap-4 py-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
              <Sprout className="h-6 w-6 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-black text-primary uppercase">{storeName}</div>
              <div className="text-[11px] text-muted-foreground tracking-widest uppercase">Cactus &amp; Seeds Store</div>
            </div>
          </Link>

          <form onSubmit={submitSearch} className="flex-1 min-w-[180px] max-w-xl mx-auto hidden md:flex">
            <div className="flex w-full border border-border rounded-full overflow-hidden bg-muted/40 focus-within:ring-2 focus-within:ring-ring/40">
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
              />
              <button type="submit" className="px-4 text-muted-foreground hover:text-primary transition-colors" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <Link
            href="/cart"
            className="ml-auto md:ml-0 relative flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity active:scale-[0.97]"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart / {(totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
            <span className="sm:hidden">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-[oklch(0.55_0.2_25)] text-white text-[11px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Nav bar */}
        <nav className="border-t border-border">
          <div className="container flex items-center gap-6 h-10 text-[13px] font-bold uppercase tracking-wide text-foreground/80 overflow-x-auto">
            <Link href="/" className="hover:text-primary whitespace-nowrap transition-colors">Home</Link>
            <Link href="/about" className="hover:text-primary whitespace-nowrap transition-colors">About Us</Link>
            <a href="/#shop" className="hover:text-primary whitespace-nowrap transition-colors">Shop</a>
            <Link href="/reviews" className="hover:text-primary whitespace-nowrap transition-colors">Reviews</Link>
            <Link href="/faq" className="hover:text-primary whitespace-nowrap transition-colors">FAQ</Link>
            <Link href="/cart" className="hover:text-primary whitespace-nowrap transition-colors">Cart</Link>
            {settings?.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-primary whitespace-nowrap transition-colors">Contact Us</a>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[oklch(0.25_0.05_140)] text-white/80 mt-16">
        <div className="container py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-display text-lg font-black text-white uppercase mb-2">{storeName}</div>
            <p className="text-sm leading-relaxed">
              Premium-quality cactus plants and seeds, ethically propagated and shipped discreetly worldwide.
            </p>
          </div>
          <div>
            <div className="font-bold text-white uppercase text-sm mb-3 tracking-wide">Quick Links</div>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              <a href="/#shop" className="hover:text-white transition-colors">Shop</a>
              <Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              {settings?.contactEmail ? (
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">Contact Us</a>
              ) : (
                <Link href="/cart" className="hover:text-white transition-colors">Cart</Link>
              )}
            </div>
          </div>
          <div>
            <div className="font-bold text-white uppercase text-sm mb-3 tracking-wide">Get in Touch</div>
            <div className="flex flex-col gap-2 text-sm">
              {settings?.contactEmail ? (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" /> {settings.contactEmail}
                </a>
              ) : (
                <span className="opacity-60">Contact email coming soon</span>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container py-4 text-xs opacity-60">
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
