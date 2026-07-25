import AdminBar from "@/components/AdminBar";
import { Boxes, LayoutDashboard, MessageSquare, Settings, ShoppingBag, Store, Tags } from "lucide-react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/chat", label: "Live Chat", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#f0f0f1] pt-8">
      <AdminBar />
      <div className="flex min-h-[calc(100vh-2rem)]">
        {/* WP-style dark sidebar */}
        <aside className="w-14 md:w-52 bg-[#1d2327] text-[#c3c4c7] shrink-0 flex flex-col">
          <div className="hidden md:flex items-center gap-2 px-4 py-4 text-white font-bold text-sm border-b border-white/10">
            <Store className="h-4 w-4" />
            Store Manager
          </div>
          <nav className="py-1 md:py-2 flex flex-col">
            {NAV_ITEMS.map(item => {
              const active = item.exact ? location === item.href : location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center md:justify-start gap-3 px-0 md:px-4 py-2.5 text-[13px] transition-colors ${
                    active
                      ? "bg-primary text-white font-semibold"
                      : "hover:bg-[#2c3338] hover:text-[#72aee6]"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-4 hidden md:block">
            <Link href="/" className="text-xs opacity-60 hover:opacity-100 transition-opacity">
              ← View live store
            </Link>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 md:p-8 overflow-x-hidden">
          <h1 className="font-display text-xl md:text-2xl font-black text-[#1d2327] mb-4 md:mb-6">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

