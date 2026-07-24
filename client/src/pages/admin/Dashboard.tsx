import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Boxes, DollarSign, ShoppingBag, Tags } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: products } = trpc.admin.products.list.useQuery();
  const { data: categories } = trpc.admin.categories.list.useQuery();
  const { data: orders } = trpc.admin.orders.list.useQuery();

  const paidOrders = orders?.filter(o => o.paymentStatus === "paid") ?? [];
  const revenueCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);

  const stats = [
    { label: "Products", value: products?.length ?? "—", icon: Boxes, href: "/admin/products" },
    { label: "Categories", value: categories?.length ?? "—", icon: Tags, href: "/admin/categories" },
    { label: "Orders", value: orders?.length ?? "—", icon: ShoppingBag, href: "/admin/orders" },
    { label: "Paid Revenue", value: formatPrice(revenueCents), icon: DollarSign, href: "/admin/orders" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black font-display">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick start</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Create your product categories under <Link href="/admin/categories" className="text-primary underline">Categories</Link>.</p>
          <p>2. Add products with images and prices under <Link href="/admin/products" className="text-primary underline">Products</Link>.</p>
          <p>3. Configure your WhatsApp number and payment options under <Link href="/admin/settings" className="text-primary underline">Settings</Link>.</p>
          <p>4. Track online card payments under <Link href="/admin/orders" className="text-primary underline">Orders</Link>.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
