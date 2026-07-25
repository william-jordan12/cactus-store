import { useAuth } from "@/_core/hooks/useAuth";
import AdminBar from "@/components/AdminBar";
import SupportChat from "@/components/SupportChat";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { Mail, Menu, Search, ShoppingCart, Sprout, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { itemCount, totalCents } = useCart();
  const { data: settings } = trpc.store.settings.useQuery();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const isAdmin = isAuthenticated && user?.role === "admin";
  const storeName = settings?.storeName || "Peyote Seeds Farm";

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchTerm)}`);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/#shop", label: "Shop", anchor: true },
    { href: "/#reviews", label: "Reviews", anchor: true },
    { href: "/faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
    { href: "/cart", label: "Cart" },
    ...(settings?.contactEmail ? [{ href: `mailto:${settings.contactEmail}`, label: "Contact Us", anchor: true }] : []),
  ];

  const handleNavClick = (href: string, anchor?: boolean) => {
    if (anchor) {
      if (href.startsWith("/#")) {
        const el = document.getElementById(href.slice(2));
        if (el) { el.scrollIntoView({ behavior: "smooth" }); setOpen(false); return; }
      }
      window.location.href = href;
    } else {
      navigate(href);
    }
    setOpen(false);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isAdmin ? "pt-8" : ""}`}>
      <AdminBar />

      {/* Announcement bar */}
      <div className="bg-[oklch(0.3_0.07_155)] text-white text-xs tracking-wide">
        <div className="container flex items-center justify-between h-8">
          <span className="font-semibold uppercase hidden sm:inline">Discreet worldwide shipping | 100% genuine seeds</span>
          <span className="font-semibold uppercase sm:hidden">Free worldwide shipping</span>
          <span className="hidden sm:flex items-center gap-4 text-white/70">
            <Link href="/shipping" className="hover:text-white transition-colors">Shipping & Delivery</Link>
            <Link href="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </span>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-border">
        <div className="container flex items-center gap-3 py-4 flex-wrap">
          {/* Hamburger — mobile only */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden shrink-0 p-1 -ml-1 text-foreground/70 hover:text-primary transition-colors" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sprout className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-display text-sm font-black text-primary uppercase">{storeName}</span>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col p-4">
                {navLinks.map((link) => (
                  <button
                    key={link.href + link.label}
                    onClick={() => handleNavClick(link.href, link.anchor)}
                    className="text-left py-3 px-3 text-sm font-bold uppercase tracking-wide text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
              {settings?.contactEmail && (
                <div className="border-t border-border px-5 py-4">
                  <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" /> {settings.contactEmail}
                  </a>
                </div>
              )}
            </SheetContent>
          </Sheet>

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

        {/* Desktop nav bar — hidden on mobile */}
        <nav className="border-t border-border hidden md:block">
          <div className="container flex items-center gap-6 h-10 text-[13px] font-bold uppercase tracking-wide text-foreground/80 overflow-x-auto">
            {navLinks.map((link) =>
              link.anchor ? (
                <a key={link.href} href={link.href} className="hover:text-primary whitespace-nowrap transition-colors">{link.label}</a>
              ) : (
                <Link key={link.href} href={link.href} className="hover:text-primary whitespace-nowrap transition-colors">{link.label}</Link>
              )
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[oklch(0.22_0.04_155)] text-white/80 mt-16">
        <div className="container py-10 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="font-display text-lg font-black text-white uppercase mb-2">{storeName}</div>
            <p className="text-sm leading-relaxed">
              Premium-quality cactus plants and seeds, ethically propagated and shipped discreetly worldwide.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Twitter">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <div className="font-bold text-white uppercase text-sm mb-3 tracking-wide">Quick Links</div>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              <a href="/#shop" className="hover:text-white transition-colors">Shop</a>
              <a href="/#reviews" className="hover:text-white transition-colors">Reviews</a>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              {settings?.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">Contact Us</a>
              )}
            </div>
          </div>
          <div>
            <div className="font-bold text-white uppercase text-sm mb-3 tracking-wide">Our Policy</div>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/shipping" className="hover:text-white transition-colors">Shipping & Delivery</Link>
              <Link href="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
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
            <div className="mt-4">
              <div className="font-bold text-white uppercase text-xs mb-2 tracking-wide">Payment Methods</div>
              <div className="flex flex-wrap gap-1.5">
                {["Cash App", "PayPal", "Venmo", "Zelle", "Bitcoin", "Apple Pay", "Chime", "Bank Transfer", "Crypto", "Wire Transfer"].map(method => (
                  <span key={method} className="bg-white/10 rounded px-2 py-1 text-[10px] font-semibold text-white/70">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-60">
            <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/returns" className="hover:text-white transition-colors">Returns</Link>
            </div>
          </div>
        </div>
      </footer>

      <SupportChat />
    </div>
  );
}
