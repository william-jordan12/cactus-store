import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Boxes, DollarSign, Eye, ShoppingBag, Tags } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: products } = trpc.admin.products.list.useQuery();
  const { data: categories } = trpc.admin.categories.list.useQuery();
  const { data: orders } = trpc.admin.orders.list.useQuery();
  const { data: visits } = trpc.admin.visits.recent.useQuery();

  const paidOrders = orders?.filter(o => o.paymentStatus === "paid") ?? [];
  const revenueCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);

  const stats = [
    { label: "Products", value: products?.length ?? "—", icon: Boxes, href: "/admin/products" },
    { label: "Categories", value: categories?.length ?? "—", icon: Tags, href: "/admin/categories" },
    { label: "Orders", value: orders?.length ?? "—", icon: ShoppingBag, href: "/admin/orders" },
    { label: "Paid Revenue", value: formatPrice(revenueCents), icon: DollarSign, href: "/admin/orders" },
  ];

  const time = (d: string | Date) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-1 md:pb-2 flex flex-row items-center justify-between space-y-0 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="text-xl md:text-2xl font-black font-display">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Unique visitors (last 24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-2xl font-black font-display">{visits?.unique24h ?? "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Visitor notifications can be enabled under{" "}
              <Link href="/admin/settings" className="text-primary underline">Settings</Link>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-base">Recent visits</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {!visits || visits.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {visits.recent.slice(0, 8).map(v => (
                  <li key={v.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground font-mono text-xs truncate">
                      {v.visitorId.slice(0, 8)}…
                    </span>
                    <span className="text-xs truncate flex-1 text-center">{v.path}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{time(v.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-base">Quick start</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6 text-sm text-muted-foreground space-y-2">
          <p>1. Create your product categories under <Link href="/admin/categories" className="text-primary underline">Categories</Link>.</p>
          <p>2. Add products with images and prices under <Link href="/admin/products" className="text-primary underline">Products</Link>.</p>
          <p>3. Configure your WhatsApp number and payment options under <Link href="/admin/settings" className="text-primary underline">Settings</Link>.</p>
          <p>4. Track online card payments under <Link href="/admin/orders" className="text-primary underline">Orders</Link>.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
