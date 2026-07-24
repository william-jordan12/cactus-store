import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Loader2, ShoppingBag } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-800 hover:bg-green-100",
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  failed: "bg-red-100 text-red-800 hover:bg-red-100",
};

export default function AdminOrders() {
  const { data: orders, isLoading } = trpc.admin.orders.list.useQuery(undefined, {
    refetchInterval: 15000,
  });

  return (
    <AdminLayout title="Orders">
      <p className="text-sm text-muted-foreground mb-4">
        Online payment orders (card or email payment requests) are logged here automatically. WhatsApp orders arrive
        directly in your WhatsApp chat.
      </p>
      <div className="bg-white rounded-md border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
            No online orders yet. When customers pay by card, their orders appear here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Items Purchased</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{order.customerName || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{order.customerEmail || "—"}</TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="space-y-0.5">
                      {order.items.map(item => (
                        <div key={item.id} className="text-xs">
                          {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatPrice(order.totalCents)}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[order.paymentStatus] ?? ""} variant="secondary">
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
