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
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  ImageOff,
  Loader2,
  Mail,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const paymentIcons: Record<string, string> = {
  "Cash App": "💵",
  "PayPal": "🅿️",
  "Venmo": "📱",
  "Zelle": "⚡",
  "Bitcoin": "₿",
  "Apple Pay": "🍎",
  "Chime": "💚",
  "Bank transfer": "🏦",
  "Cryptocurrency": "🪙",
  "Wire transfer": "💸",
};

export default function Cart() {
  const { items, totalCents, updateQuantity, removeItem, clearCart } = useCart();
  const { data: settings } = trpc.store.settings.useQuery();
  const placeOrder = trpc.store.placeOrder.useMutation();

  const [step, setStep] = useState<"cart" | "checkout" | "contact">("cart");
  const [selectedPayment, setSelectedPayment] = useState<string>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [placedOrder, setPlacedOrder] = useState<{
    orderId: number;
    totalCents: number;
    paymentMethod: string;
    items: { title: string; quantity: number; unitPriceCents: number }[];
  } | null>(null);

  const minimumOrderCents = settings?.minimumOrderCents ?? 10000;
  const belowMinimum = totalCents < minimumOrderCents;
  const whatsappNumber = settings?.whatsappNumber ?? "";
  const contactEmail = settings?.contactEmail ?? "";

  const buildPaymentMessage = () => {
    if (!placedOrder) return "";
    const itemLines = placedOrder.items
      .map(i => `  - ${i.title} × ${i.quantity} (${formatPrice(i.unitPriceCents * i.quantity)})`)
      .join("\n");
    return `Hi, I'd like to complete my payment for an order on ${settings?.storeName || "your store"}.

Order ID: #${placedOrder.orderId}
Payment Method: ${placedOrder.paymentMethod}
Total: ${formatPrice(placedOrder.totalCents)}

Items:
${itemLines}

Customer Name: ${name}
Email: ${email}
Phone: ${phone}

Please send me the payment instructions or credentials for ${placedOrder.paymentMethod}. Thank you!`;
  };

  const handlePlaceOrder = async () => {
    if (!name.trim()) return toast.error("Please enter your name");
    if (!email.trim()) return toast.error("Please enter your email");
    if (!phone.trim()) return toast.error("Please enter your phone number");
    if (shippingAddress.trim().length < 5) return toast.error("Please enter your shipping address");
    const billing = sameAsShipping ? shippingAddress : billingAddress;
    if (billing.trim().length < 5) return toast.error("Please enter your billing address");
    if (!selectedPayment) return toast.error("Please select a payment method");

    try {
      const result = await placeOrder.mutateAsync({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        shippingAddress: shippingAddress.trim(),
        billingAddress: billing.trim(),
        paymentMethod: selectedPayment as never,
      });
      setPlacedOrder({
        orderId: result.orderId,
        totalCents: result.totalCents,
        paymentMethod: result.paymentMethod,
        items: result.items,
      });
      clearCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to place order");
    }
  };

  const openWhatsApp = () => {
    const msg = buildPaymentMessage();
    const encoded = encodeURIComponent(msg);
    const url = whatsappNumber
      ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  const openEmail = () => {
    const msg = buildPaymentMessage();
    const subject = encodeURIComponent(`Order #${placedOrder?.orderId} — Payment via ${placedOrder?.paymentMethod}`);
    const body = encodeURIComponent(msg);
    window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  // Order confirmation / contact step
  if (placedOrder) {
    return (
      <StoreLayout>
        <div className="container py-10 md:py-14 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
            <h1 className="font-display text-2xl md:text-3xl font-black mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Your order <span className="font-bold text-foreground">#{placedOrder.orderId}</span> for{" "}
              <span className="font-bold text-foreground">{formatPrice(placedOrder.totalCents)}</span> has
              been placed. Choose how you'd like to complete your payment using{" "}
              <span className="font-bold text-foreground">{placedOrder.paymentMethod}</span>.
            </p>
          </div>

          {/* Contact method selection */}
          <div className="bg-white border border-border rounded-lg p-6 md:p-8">
            <h2 className="font-display text-lg font-bold text-center mb-6">Complete Your Payment</h2>
            <p className="text-center text-muted-foreground text-sm mb-8">
              Select a contact method below. A pre-filled message with your order details will be
              sent to our team, and we'll get back to you with payment instructions.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={openEmail}
                className="group flex flex-col items-center gap-3 border-2 border-border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm mb-1">Pay via Email</div>
                  <div className="text-[11px] text-muted-foreground break-all">{contactEmail || "No email set"}</div>
                </div>
              </button>

              <button
                onClick={openWhatsApp}
                className="group flex flex-col items-center gap-3 border-2 border-border rounded-lg p-6 hover:border-green-600 hover:bg-green-50 transition-all"
              >
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-green-600">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm mb-1">Pay via WhatsApp</div>
                  <div className="text-[11px] text-muted-foreground">
                    {whatsappNumber || "No number set"}
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to shop
              </Link>
            </div>
          </div>
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
          <Link href="/shop">
            <Button className="uppercase font-bold tracking-wide">Browse Shop</Button>
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
              <Link href="/shop" className="text-xs text-primary underline">
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

            <Button
              onClick={() => setStep("checkout")}
              disabled={belowMinimum}
              className="w-full h-12 font-bold uppercase tracking-wide text-sm"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Checkout
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4 text-center leading-relaxed">
              Choose from Cash App, PayPal, Venmo, Zelle, Bitcoin, Apple Pay, Chime, bank
              transfer, cryptocurrency, or wire transfer.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout dialog — Step 1: Details + payment selection */}
      <Dialog open={step === "checkout"} onOpenChange={open => { if (!open) setStep("cart"); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Enter your details and select a payment method. After placing your order, you'll
              choose how to send us your payment.
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

            {/* Payment method grid */}
            <div className="space-y-2">
              <Label>Payment method *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {settings?.paymentMethods?.map(method => (
                  <button
                    key={method}
                    onClick={() => setSelectedPayment(method)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                      selectedPayment === method
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <span className="text-lg">{paymentIcons[method] || "💳"}</span>
                    <span className="flex-1 truncate">{method}</span>
                    {selectedPayment === method && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-sm font-bold border-t border-border pt-3">
              <span>Total to pay</span>
              <span className="text-primary">{formatPrice(totalCents)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("cart")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <Button onClick={handlePlaceOrder} disabled={placeOrder.isPending || !selectedPayment}>
              {placeOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Wallet className="h-4 w-4 mr-2" />
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StoreLayout>
  );
}
