import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { Eye, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order, OrderItem } from "../../../../drizzle/schema";

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
  const [viewing, setViewing] = useState<(Order & { items: OrderItem[] }) | null>(null);

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
                    <TableHead className="w-10 text-right">View</TableHead>
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
                      <TableCell className="text-right">
                        <button
                          onClick={() => setViewing(order)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          aria-label="View order details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
                      onClick={() => setViewing(order)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      aria-label="View order details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
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

      {/* Order details dialog */}
      <Dialog open={Boolean(viewing)} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg p-0 gap-0">
          <div className="p-4 sm:p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>Order #{viewing?.id}</DialogTitle>
              <DialogDescription>
                {viewing && new Date(viewing.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            {viewing && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={STATUS_STYLES[viewing.paymentStatus] ?? ""} variant="secondary">
                    {viewing.paymentStatus}
                  </Badge>
                  {viewing.paymentMethod && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      {viewing.paymentMethod}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2.5 text-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Customer</div>
                    <div className="font-medium">{viewing.customerName || "—"}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Email</div>
                      <div className="break-all">{viewing.customerEmail || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Phone</div>
                      <div>{viewing.customerPhone || "—"}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Shipping Address</div>
                    <div className="text-muted-foreground">{viewing.shippingAddress || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Billing Address</div>
                    <div className="text-muted-foreground">{viewing.billingAddress || "—"}</div>
                  </div>
                </div>

                <div className="border border-border rounded-lg divide-y divide-border">
                  {viewing.items.map(item => (
                    <div key={item.id} className="flex justify-between gap-2 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                      </span>
                      <span className="font-medium shrink-0">
                        {formatPrice(item.unitPriceCents * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between gap-2 px-3 py-2 font-bold">
                    <span>Total</span>
                    <span>{formatPrice(viewing.totalCents)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
