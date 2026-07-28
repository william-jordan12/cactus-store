import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-800 hover:bg-green-100",
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  failed: "bg-red-100 text-red-800 hover:bg-red-100",
};

export default function AdminOrders() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.admin.orders.list.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const deleteOrder = trpc.admin.orders.delete.useMutation({
    onSuccess: () => {
      toast.success("Order deleted");
      utils.admin.orders.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AdminLayout title="Orders">
      <p className="text-sm text-muted-foreground mb-4">
        Online payment orders (card or email payment requests) are logged here automatically. WhatsApp orders arrive
        directly in your WhatsApp chat.
      </p>
      <div className="bg-white rounded-md border border-border">
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
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Items Purchased</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="w-10"></TableHead>
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
                      <TableCell>
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this order?")) {
                              deleteOrder.mutate({ id: order.id });
                            }
                          }}
                          disabled={deleteOrder.isPending}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {orders.map(order => (
                <div key={order.id} className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{order.customerName || "—"}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_STYLES[order.paymentStatus] ?? ""} variant="secondary">
                        {order.paymentStatus}
                      </Badge>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this order?")) {
                            deleteOrder.mutate({ id: order.id });
                          }
                        }}
                        disabled={deleteOrder.isPending}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete order"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.customerEmail || "—"}
                  </div>
                  <div className="text-xs space-y-0.5">
                    {order.items.map(item => (
                      <div key={item.id}>
                        {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="font-semibold text-sm">{formatPrice(order.totalCents)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
