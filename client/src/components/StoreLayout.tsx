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
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#00D632]"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.18 1.897-.962 6.502-1.36 8.627-.168.9-.5 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.487-.429-.008-1.252-.241-1.865-.444-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141a.506.506 0 0 1 .171.325c.016.093.036.306.02.472z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Cash App</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#003087]"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">PayPal</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#3D95CE]"><path d="M13.687 16.235c-1.883 1.37-3.848 2.104-5.62 2.104-2.67 0-5.082-1.38-6.44-3.514H0l1.984 3.096c.298.464.883.617 1.383.34l2.084-1.156c.78.672 1.794 1.096 2.91 1.096.883 0 1.68-.27 2.355-.726.39-.26.84-.627 1.212-1.106.372-.48.65-1.054.807-1.69l.048-.198-.004.006-.004-.006-.162.095zm3.65-8.987c-.087.593-.398 1.096-.823 1.454-.457.39-.998.603-1.536.612h-.012c-.47 0-.923-.164-1.286-.42l-.004.002-2.06 1.224c-.372.22-.788.34-1.206.34-.503 0-1-.14-1.417-.393l-2.134-1.282-.004-.002c-.073-.048-.14-.096-.224-.156l-.002.002-.004-.002-.002.002-.006.004-.002.002-2.22-1.33c-.38-.226-.79-.346-1.208-.346-.527 0-1.04.176-1.442.478L.15 9.332C-.056 9.46-.25 9.624-.416 9.824c-.412.498-.636 1.072-.636 1.66 0 .472.128.92.362 1.304.596.97 1.62 1.594 2.828 1.78.032.005.064.01.096.016l-.006.002 1.252 1.94c.298.464.883.617 1.383.34l2.084-1.156c.78.672 1.794 1.096 2.91 1.096 1.843 0 3.482-.96 4.477-2.47.486-.74.81-1.59.96-2.51.128-.79.16-1.61.038-2.412-.008-.054-.018-.108-.028-.16l-.002.004-.002-.004z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Venmo</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#6C1CD3]"><path d="M6.064 17.594l1.76-4.555h-.004l-1.76-4.555h2.12l1.24 3.597h.004l1.24-3.597h2.12l-1.76 4.555h.004l1.76 4.555H8.184l-1.24-3.597h-.004l-1.24 3.597zm7.52 0l1.76-4.555h-.004l-1.76-4.555h2.12l1.24 3.597h.004l1.24-3.597h2.12l-1.76 4.555h.004l1.76 4.555h-2.12l-1.24-3.597h-.004l-1.24 3.597zm7.52 0l1.76-4.555h-.004l-1.76-4.555h2.12l1.24 3.597h.004l1.24-3.597h2.12l-1.76 4.555h.004l1.76 4.555h-2.12l-1.24-3.597h-.004l-1.24 3.597z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Zelle</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#F7931A]"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 10.894c.166 1.129.843 3.073 1.164 4.082.133.42.174.776.174 1.06 0 .338-.07.68-.206 1.005-.165.397-.472.72-.912.96-.44.236-.987.355-1.635.355H15.06v2.13h2.034c.96 0 1.738-.224 2.335-.67.598-.447.946-1.058 1.048-1.834h2.05c-.127 1.04-.535 1.987-1.227 2.84-.692.853-1.604 1.505-2.734 1.956-1.13.451-2.397.676-3.795.676-1.028 0-1.986-.15-2.873-.45a5.896 5.896 0 0 1-2.27-1.28 5.735 5.735 0 0 1-1.42-2.04c-.34-.793-.51-1.65-.51-2.568 0-.878.166-1.71.498-2.496a5.78 5.78 0 0 1 1.37-2.005 5.897 5.897 0 0 1 2.097-1.333c.81-.296 1.695-.444 2.655-.444.47 0 .95.044 1.44.132.49.088.953.22 1.388.396V7.71c0-.97-.396-1.746-1.19-2.328-.793-.582-1.813-.872-3.062-.872-.67 0-1.318.08-1.944.24-.626.16-1.16.37-1.6.63-.44.26-.78.554-1.02.88a2.587 2.587 0 0 0-.36 1.068h2.008c.07-.255.21-.472.42-.652.21-.18.464-.27.762-.27.35 0 .623.104.82.312.196.208.294.516.294.924v.9h-1.08c-1.56 0-2.717.368-3.468 1.104-.752.736-1.128 1.716-1.128 2.94 0 .98.28 1.796.84 2.448.56.652 1.353.978 2.378.978.56 0 1.07-.09 1.53-.27.46-.18.843-.42 1.15-.72.307-.3.52-.65.636-1.05.117-.4.175-.83.175-1.29v-.24h-1.634v-1.74h3.734z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Bitcoin</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white/70"><path d="M17.72 7.56c-.07.06-2.18 1.26-2.18 3.88 0 3.01 2.67 4.07 2.76 4.1-.01.06-.43 1.48-1.42 2.93-.89 1.28-1.83 2.56-3.28 2.56-.79 0-1.31-.26-1.97-.57-.67-.32-1.42-.72-2.55-.72-1.17 0-1.94.41-2.63.74-.55.27-1.06.51-1.69.51-1.57 0-2.61-1.43-3.59-3.05C.9 14.7.22 11.94.22 9.3c0-4.29 2.81-6.59 5.57-6.59 1.42 0 2.6.46 3.48.87.69.33 1.29.61 1.73.61.4 0 .94-.3 1.67-.61.62-.26 1.34-.58 2.3-.58.35 0 1.61.03 2.45 1.23l-.1.06zM14.55 1.5c0 1.13-.41 2.19-1.1 3.04-.88 1.08-1.96 1.7-3.05 1.6-.02-.13-.02-.27-.02-.4 0-1.08.47-2.24 1.09-3.03.31-.4.71-.73 1.17-1 .46-.26.89-.41 1.33-.41.01.06.01.12.02.2l-.02.01c.01.03.01.06.01.09h-.01.01.57z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Apple Pay</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#1ECF63]"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.25 7.2h-1.5c-.414 0-.75.336-.75.75v.09c-.87-.65-1.92-1.04-3-1.04-2.9 0-5.25 2.35-5.25 5.25v3.5c0 .414.336.75.75.75h1.5c.414 0 .75-.336.75-.75v-3.5c0-1.24 1.01-2.25 2.25-2.25s2.25 1.01 2.25 2.25v3.5c0 .414.336.75.75.75h1.5c.414 0 .75-.336.75-.75v-3.5c0-2.9-2.35-5.25-5.25-5.25-.35 0-.69.03-1.02.1v1.18c.33-.07.67-.1 1.02-.1 1.24 0 2.25 1.01 2.25 2.25v3.5c0 .414.336.75.75.75h1.5c.414 0 .75-.336.75-.75v-3.5c0-2.9-2.35-5.25-5.25-5.25z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Chime</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white/70"><path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V6zm0 4h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8zm4 3a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1zm3 0a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2h-1a1 1 0 0 1-1-1z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Bank Transfer</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#F7931A]"><path d="M12 0L5.81 6.19v12.38L12 24l6.19-5.43V6.19L12 0zm4.41 15.14l-4.41 3.89-4.41-3.89V8.86l4.41-3.89 4.41 3.89v6.28z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Crypto</span>
                </div>
                <div className="bg-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white/70"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.28 1.95.54 2.38 1.2 2.38 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.64c.09 1.7 1.36 2.66 2.85 2.95V19h2.26v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.95-3.56z"/></svg>
                  <span className="text-[10px] font-semibold text-white/70">Wire Transfer</span>
                </div>
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
