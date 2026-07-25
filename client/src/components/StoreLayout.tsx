import { useAuth } from "@/_core/hooks/useAuth";
import AdminBar from "@/components/AdminBar";
import SupportChat from "@/components/SupportChat";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { Mail, Menu, Search, ShoppingCart, Sprout, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { itemCount, totalCents } = useCart();
  const { data: settings } = trpc.store.settings.useQuery();
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const isAdmin = isAuthenticated && user?.role === "admin";
  const storeName = settings?.storeName || "Peyote Seeds Farm";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) return;
    debounceRef.current = setTimeout(() => {
      navigate(`/shop?search=${encodeURIComponent(value)}`);
    }, 400);
  }, [navigate]);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/reviews", label: "Reviews" },
    { href: "/about", label: "About Us" },
    { href: "/faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
  ];

  const handleNavClick = (href: string) => {
    navigate(href);
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
                    <img src="/cactus-logo.png" alt="Logo" className="h-6 w-6 object-contain" />
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
                    onClick={() => handleNavClick(link.href)}
                    className={`text-left py-3 px-3 text-sm font-bold uppercase tracking-wide rounded-md transition-colors ${
                      isActive(link.href)
                        ? "text-primary bg-primary/5"
                        : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => handleNavClick("/cart")}
                  className="text-left py-3 px-3 text-sm font-bold uppercase tracking-wide text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                >
                  Cart {itemCount > 0 && `(${itemCount})`}
                </button>
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
              <img src="/cactus-logo.png" alt="Logo" className="h-7 w-7 object-contain" />
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
                onChange={e => handleSearchChange(e.target.value)}
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
          <div className="container flex items-center gap-6 h-10 text-[13px] font-bold uppercase tracking-wide overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap transition-colors ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
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
              <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
              <Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link>
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
                {/* Cash App Pay - official lockup from afterpaycdn */}
                <img src="https://static.afterpaycdn.com/en-US/integration/logo/lockup/cashapppay-color-white-32.svg" alt="Cash App Pay" className="h-7" />
                {/* PayPal - official SVG from simple-icons */}
                <div className="h-7 w-7 rounded bg-[#003087] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#009cde]"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/><path d="M19.114 6.162c-.017.116-.036.233-.056.351-.974 5.107-4.296 6.886-8.553 6.886h-2.057a.97.97 0 0 0-.953.812l-.99 6.268-.281 1.777c-.05.316.193.601.513.601h4.07c.472 0 .874-.344.948-.81l.032-.164.814-5.158.052-.287a.97.97 0 0 1 .948-.81h.665c3.83 0 6.842-1.558 7.715-6.01.367-1.87.179-3.447-.958-4.557a3.83 3.83 0 0 0-1.157-.919z"/></svg>
                </div>
                {/* Venmo - official icon */}
                <div className="h-7 w-7 rounded bg-[#3D95CE] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M21.772 13.119c-.267 0-.381-.251-.38-.655 0-.533.121-1.575.712-1.575.267 0 .357.243.357.598 0 .533-.13 1.632-.689 1.632Zm.502-3.377c-1.677 0-2.405 1.285-2.405 2.658 0 1.042.421 1.874 1.693 1.874 1.717 0 2.438-1.406 2.438-2.763 0-1.025-.462-1.769-1.726-1.769Zm-3.833 0c-.558 0-.964.17-1.393.477-.154-.275-.462-.477-.932-.477-.542 0-.947.219-1.247.437l-.04-.364H13.54l-.688 4.354h1.506l.479-3.053c.129-.065.323-.154.518-.154.145 0 .267.049.267.267 0 .056-.016.145-.024.218l-.429 2.722h1.498l.478-3.053c.138-.073.324-.154.51-.154.146 0 .268.049.268.267 0 .056-.017.145-.025.218l-.429 2.722h1.499l.461-2.908c.025-.153.049-.388.049-.549 0-.582-.267-.97-1.037-.97Zm-6.871 0c-.575 0-.98.219-1.287.421l-.017-.348H8.962l-.689 4.354H9.78l.478-3.053c.13-.065.324-.154.518-.154.147 0 .268.049.268.242 0 .081-.024.227-.032.299l-.422 2.666h1.499l.462-2.908c.024-.153.049-.388.049-.549 0-.582-.268-.97-1.03-.97Zm-5.631 1.834c.041-.485.413-.824.697-.824.162 0 .299.097.299.291 0 .404-.713.533-.996.533Zm.843-1.834c-1.604 0-2.382 1.39-2.382 2.698 0 1.01.478 1.817 1.814 1.817.527 0 1.07-.113 1.418-.282l.186-1.26c-.494.25-.874.347-1.271.347-.365 0-.64-.194-.64-.687.826-.008 2.252-.347 2.252-1.453 0-.687-.494-1.18-1.377-1.18Zm-4.239.267c.089.186.146.412.146.743 0 .606-.429 1.494-.777 2.06l-.373-2.989L0 9.969l.705 4.2h1.757c.77-1.01 1.718-2.448 1.718-3.554 0-.347-.073-.622-.235-.889l-1.402.283Z"/></svg>
                </div>
                {/* Zelle - official icon */}
                <div className="h-7 w-7 rounded bg-[#6C1CD3] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z"/></svg>
                </div>
                {/* Bitcoin - official Bitcoin logo from CDN */}
                <div className="h-7 w-7 rounded bg-[#F7931A] flex items-center justify-center">
                  <svg viewBox="0.004 0 64 64" className="h-5 w-5 fill-white"><path d="M63.04 39.741c-4.274 17.143-21.638 27.575-38.783 23.301C7.12 58.768-3.313 41.404.962 24.262 5.234 7.117 22.597-3.317 39.737.957c17.144 4.274 27.576 21.64 23.302 38.784z"/><path d="M46.11 27.441c.636-4.258-2.606-6.547-7.039-8.074l1.438-5.768-3.512-.875-1.4 5.616c-.922-.23-1.87-.447-2.812-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.68 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117l-.37-.092-2.297 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.02 4.57 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.507.875 1.44-5.772c5.987 1.133 10.49.676 12.383-4.738 1.527-4.36-.075-6.875-3.225-8.516 2.294-.531 4.022-2.04 4.483-5.157zM38.087 38.69c-1.086 4.36-8.426 2.004-10.807 1.412l1.928-7.729c2.38.594 10.011 1.77 8.88 6.317zm1.085-11.312c-.99 3.966-7.1 1.951-9.083 1.457l1.748-7.01c1.983.494 8.367 1.416 7.335 5.553z"/></svg>
                </div>
                {/* Apple Pay - official wordmark */}
                <div className="h-7 px-2 rounded bg-white flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-black"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.23 0-1.44.65-2.2.46-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  <span className="text-black text-[11px] font-semibold tracking-tight">Pay</span>
                </div>
                {/* Chime - styled badge */}
                <div className="h-7 px-2 rounded bg-[#25C654] flex items-center">
                  <span className="text-white text-[11px] font-bold tracking-tight">chime</span>
                </div>
                {/* Bank Transfer */}
                <div className="h-7 px-2 rounded bg-white/10 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white/80"><path d="M12 2L2 7v2h20V7L12 2zm0 2.5L18.5 8H5.5L12 4.5zM4 11v8h2v-8H4zm5 0v8h2v-8H9zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zM2 21h20v2H2v-2z"/></svg>
                  <span className="text-white/80 text-[10px] font-semibold">Bank</span>
                </div>
                {/* Crypto */}
                <div className="h-7 px-2 rounded bg-white/10 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#F7931A]"><path d="M12 0L5.81 6.19v12.38L12 24l6.19-5.43V6.19L12 0zm4.41 15.14l-4.41 3.89-4.41-3.89V8.86l4.41-3.89 4.41 3.89v6.28z"/></svg>
                  <span className="text-white/80 text-[10px] font-semibold">Crypto</span>
                </div>
                {/* Wire Transfer */}
                <div className="h-7 px-2 rounded bg-white/10 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white/80"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.28 1.95.54 2.38 1.2 2.38 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.64c.09 1.7 1.36 2.66 2.85 2.95V19h2.26v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.95-3.56z"/></svg>
                  <span className="text-white/80 text-[10px] font-semibold">Wire</span>
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
