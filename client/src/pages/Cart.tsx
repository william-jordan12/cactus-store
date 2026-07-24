import StoreLayout from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Cart() {
  const { items, totalCents, updateQuantity, removeItem, clearCart } = useCart();
  const { data: settings } = trpc.store.settings.useQuery();
  const placeOrder = trpc.store.placeOrder.useMutation();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: number;
    totalCents: number;
    paymentMethod: string;
    contactEmail: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const minimumOrderCents = settings?.minimumOrderCents ?? 10000;
  const paymentMethods = settings?.paymentMethods ?? [];
  const belowMinimum = totalCents < minimumOrderCents;
  const paymentsEnabled = settings?.onlinePaymentsEnabled ?? false;

  const handlePlaceOrder = async () => {
    const billing = sameAsShipping ? shippingAddress : billingAddress;
    if (!name.trim()) return toast.error("Please enter your name");
    if (!email.trim()) return toast.error("Please enter your email");
    if (!phone.trim()) return toast.error("Please enter your phone number");
    if (shippingAddress.trim().length < 5) return toast.error("Please enter your shipping address");
    if (billing.trim().length < 5) return toast.error("Please enter your billing address");
    if (!paymentMethod) return toast.error("Please choose a payment method");

    try {
      const result = await placeOrder.mutateAsync({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        shippingAddress: shippingAddress.trim(),
        billingAddress: billing.trim(),
        paymentMethod: paymentMethod as never,
      });
      setPlacedOrder({
        orderId: result.orderId,
        totalCents: result.totalCents,
        paymentMethod: result.paymentMethod,
        contactEmail: result.contactEmail,
      });
      setCheckoutOpen(false);
      clearCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to place order");
    }
  };

  // Order confirmation screen after successful checkout
  if (placedOrder) {
    return (
      <StoreLayout>
        <div className="container py-24 flex flex-col items-center text-center max-w-xl">
          <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
          <h1 className="font-display text-2xl font-black mb-2">Order received!</h1>
          <p className="text-muted-foreground mb-2">
            Your order <span className="font-bold text-foreground">#{placedOrder.orderId}</span> for{" "}
            <span className="font-bold text-foreground">{formatPrice(placedOrder.totalCents)}</span> has been
            placed with payment method{" "}
            <span className="font-bold text-foreground">{placedOrder.paymentMethod}</span>.
          </p>
          <p className="text-muted-foreground mb-6">
            Our team will contact you shortly at the email and phone number you provided with the payment
            instructions. Questions? Reach us at{" "}
            <a href={`mailto:${placedOrder.contactEmail}`} className="text-primary underline">
              {placedOrder.contactEmail}
            </a>
            .
          </p>
          <Link href="/">
            <Button className="uppercase font-bold tracking-wide">Continue Shopping</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container py-24 flex flex-col items-center text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h1 className="font-display text-2xl font-black mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Browse the shop and add some products to get started.</p>
          <Link href="/">
            <Button className="uppercase font-bold tracking-wide">Continue Shopping</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container py-10">
        <h1 className="font-display text-2xl md:text-3xl font-black uppercase tracking-wide mb-8">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Cart items */}
          <div className="bg-white border border-border rounded-md divide-y divide-border">
            {items.map(item => (
              <div key={item.productId} className="flex gap-4 p-4 items-center">
                <div className="h-20 w-20 rounded-md bg-muted/50 overflow-hidden flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary leading-snug mb-0.5 truncate">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{formatPrice(item.priceCents)} each</div>
                </div>
                <div className="flex items-center gap-1 border border-border rounded-full px-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="w-20 text-right font-bold text-sm">
                  {formatPrice(item.priceCents * item.quantity)}
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Remove ${item.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="p-4 flex justify-between items-center">
              <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive underline">
                Clear cart
              </button>
              <Link href="/" className="text-xs text-primary underline">
                Continue shopping
              </Link>
            </div>
          </div>

          {/* Summary + checkout */}
          <div className="bg-white border border-border rounded-md p-6 lg:sticky lg:top-6">
            <h2 className="font-display font-black uppercase tracking-wide mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between gap-2">
                  <span className="truncate text-muted-foreground">
                    {item.title} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">{formatPrice(item.priceCents * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 flex justify-between items-center mb-4">
              <span className="font-bold uppercase text-sm tracking-wide">Total</span>
              <span className="font-display font-black text-2xl text-primary">{formatPrice(totalCents)}</span>
            </div>

            {belowMinimum && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-xs mb-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  The minimum order amount is <strong>{formatPrice(minimumOrderCents)}</strong>. Add{" "}
                  <strong>{formatPrice(minimumOrderCents - totalCents)}</strong> more to proceed to checkout.
                </span>
              </div>
            )}

            {!paymentsEnabled && (
              <div className="flex items-start gap-2 bg-muted border border-border text-muted-foreground rounded-md p-3 text-xs mb-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Online checkout is temporarily unavailable. Please check back soon.</span>
              </div>
            )}

            <Button
              onClick={() => setCheckoutOpen(true)}
              disabled={belowMinimum || !paymentsEnabled}
              className="w-full h-12 font-bold uppercase tracking-wide text-sm"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Checkout
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4 text-center leading-relaxed">
              Secure checkout — choose from Cash App, PayPal, Venmo, Zelle, Bitcoin, Apple Pay, Chime, bank
              transfer, cryptocurrency, or wire transfer.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Enter your details and choose how you'd like to pay. Our team will send you the payment
              instructions right after you place the order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="co-name">Full name *</Label>
                <Input id="co-name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-email">Email *</Label>
                <Input
                  id="co-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-phone">Phone number *</Label>
              <Input
                id="co-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-shipping">Shipping address *</Label>
              <Textarea
                id="co-shipping"
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                placeholder="Street, city, state/province, postal code, country"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="co-same"
                checked={sameAsShipping}
                onCheckedChange={v => setSameAsShipping(v === true)}
              />
              <Label htmlFor="co-same" className="text-sm font-normal cursor-pointer">
                Billing address same as shipping
              </Label>
            </div>
            {!sameAsShipping && (
              <div className="space-y-1.5">
                <Label htmlFor="co-billing">Billing address *</Label>
                <Textarea
                  id="co-billing"
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  placeholder="Street, city, state/province, postal code, country"
                  rows={2}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Payment method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose how you'd like to pay" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border pt-3">
              <span>Total to pay</span>
              <span className="text-primary">{formatPrice(totalCents)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlaceOrder} disabled={placeOrder.isPending}>
              {placeOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StoreLayout>
  );
}
