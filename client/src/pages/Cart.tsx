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

function PaymentLogo({ method }: { method: string }) {
  switch (method) {
    case "Cash App":
      return (
        <div className="h-6 w-6 rounded bg-[#00D632] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 7.215h-2.15c-.18 0-.327.147-.327.327v1.403c-.353-.25-.776-.398-1.232-.398-1.143 0-2.07.927-2.07 2.07 0 1.144.927 2.071 2.07 2.071.457 0 .88-.148 1.232-.4v1.04c0 .684.556 1.24 1.24 1.24h2.15c.18 0 .327-.147.327-.327V7.542c0-.18-.147-.327-.327-.327zm-7.055 0h-2.15c-.18 0-.327.147-.327.327v5.93c0 .18.147.327.327.327h2.15c.18 0 .327-.147.327-.327V7.542c0-.18-.147-.327-.327-.327zm-3.577 0H5.112c-.18 0-.327.147-.327.327v5.93c0 .18.147.327.327.327h2.15c.18 0 .327-.147.327-.327V7.542c0-.18-.147-.327-.327-.327z"/></svg>
        </div>
      );
    case "PayPal":
      return (
        <div className="h-6 w-6 rounded bg-[#003087] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#009cde]"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/><path d="M19.114 6.162c-.017.116-.036.233-.056.351-.974 5.107-4.296 6.886-8.553 6.886h-2.057a.97.97 0 0 0-.953.812l-.99 6.268-.281 1.777c-.05.316.193.601.513.601h4.07c.472 0 .874-.344.948-.81l.032-.164.814-5.158.052-.287a.97.97 0 0 1 .948-.81h.665c3.83 0 6.842-1.558 7.715-6.01.367-1.87.179-3.447-.958-4.557a3.83 3.83 0 0 0-1.157-.919z"/></svg>
        </div>
      );
    case "Venmo":
      return (
        <div className="h-6 w-6 rounded bg-[#3D95CE] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white"><path d="M21.772 13.119c-.267 0-.381-.251-.38-.655 0-.533.121-1.575.712-1.575.267 0 .357.243.357.598 0 .533-.13 1.632-.689 1.632Zm.502-3.377c-1.677 0-2.405 1.285-2.405 2.658 0 1.042.421 1.874 1.693 1.874 1.717 0 2.438-1.406 2.438-2.763 0-1.025-.462-1.769-1.726-1.769Zm-3.833 0c-.558 0-.964.17-1.393.477-.154-.275-.462-.477-.932-.477-.542 0-.947.219-1.247.437l-.04-.364H13.54l-.688 4.354h1.506l.479-3.053c.129-.065.323-.154.518-.154.145 0 .267.049.267.267 0 .056-.016.145-.024.218l-.429 2.722h1.498l.478-3.053c.138-.073.324-.154.51-.154.146 0 .268.049.268.267 0 .056-.017.145-.025.218l-.429 2.722h1.499l.461-2.908c.025-.153.049-.388.049-.549 0-.582-.267-.97-1.037-.97Zm-6.871 0c-.575 0-.98.219-1.287.421l-.017-.348H8.962l-.689 4.354H9.78l.478-3.053c.13-.065.324-.154.518-.154.147 0 .268.049.268.242 0 .081-.024.227-.032.299l-.422 2.666h1.499l.462-2.908c.024-.153.049-.388.049-.549 0-.582-.268-.97-1.03-.97Zm-5.631 1.834c.041-.485.413-.824.697-.824.162 0 .299.097.299.291 0 .404-.713.533-.996.533Zm.843-1.834c-1.604 0-2.382 1.39-2.382 2.698 0 1.01.478 1.817 1.814 1.817.527 0 1.07-.113 1.418-.282l.186-1.26c-.494.25-.874.347-1.271.347-.365 0-.64-.194-.64-.687.826-.008 2.252-.347 2.252-1.453 0-.687-.494-1.18-1.377-1.18Zm-4.239.267c.089.186.146.412.146.743 0 .606-.429 1.494-.777 2.06l-.373-2.989L0 9.969l.705 4.2h1.757c.77-1.01 1.718-2.448 1.718-3.554 0-.347-.073-.622-.235-.889l-1.402.283Z"/></svg>
        </div>
      );
    case "Zelle":
      return (
        <div className="h-6 w-6 rounded bg-[#6C1CD3] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white"><path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z"/></svg>
        </div>
      );
    case "Bitcoin":
      return (
        <div className="h-6 w-6 rounded bg-[#F7931A] flex items-center justify-center">
          <svg viewBox="0.004 0 64 64" className="h-4 w-4 fill-white"><path d="M63.04 39.741c-4.274 17.143-21.638 27.575-38.783 23.301C7.12 58.768-3.313 41.404.962 24.262 5.234 7.117 22.597-3.317 39.737.957c17.144 4.274 27.576 21.64 23.302 38.784z"/><path d="M46.11 27.441c.636-4.258-2.606-6.547-7.039-8.074l1.438-5.768-3.512-.875-1.4 5.616c-.922-.23-1.87-.447-2.812-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.68 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117l-.37-.092-2.297 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.02 4.57 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.507.875 1.44-5.772c5.987 1.133 10.49.676 12.383-4.738 1.527-4.36-.075-6.875-3.225-8.516 2.294-.531 4.022-2.04 4.483-5.157zM38.087 38.69c-1.086 4.36-8.426 2.004-10.807 1.412l1.928-7.729c2.38.594 10.011 1.77 8.88 6.317zm1.085-11.312c-.99 3.966-7.1 1.951-9.083 1.457l1.748-7.01c1.983.494 8.367 1.416 7.335 5.553z"/></svg>
        </div>
      );
    case "Apple Pay":
      return (
        <div className="h-6 px-1.5 rounded bg-black flex items-center gap-0.5">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.23 0-1.44.65-2.2.46-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          <span className="text-white text-[10px] font-semibold tracking-tight">Pay</span>
        </div>
      );
    case "Chime":
      return (
        <div className="h-6 px-1.5 rounded bg-[#25C654] flex items-center">
          <span className="text-white text-[10px] font-bold tracking-tight">chime</span>
        </div>
      );
    case "Bank transfer":
      return (
        <div className="h-6 px-1.5 rounded bg-muted flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-muted-foreground"><path d="M12 2L2 7v2h20V7L12 2zm0 2.5L18.5 8H5.5L12 4.5zM4 11v8h2v-8H4zm5 0v8h2v-8H9zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zM2 21h20v2H2v-2z"/></svg>
          <span className="text-muted-foreground text-[10px] font-semibold">Bank</span>
        </div>
      );
    case "Cryptocurrency":
      return (
        <div className="h-6 px-1.5 rounded bg-muted flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-[#F7931A]"><path d="M12 0L5.81 6.19v12.38L12 24l6.19-5.43V6.19L12 0zm4.41 15.14l-4.41 3.89-4.41-3.89V8.86l4.41-3.89 4.41 3.89v6.28z"/></svg>
          <span className="text-muted-foreground text-[10px] font-semibold">Crypto</span>
        </div>
      );
    case "Wire transfer":
      return (
        <div className="h-6 px-1.5 rounded bg-muted flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-muted-foreground"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.28 1.95.54 2.38 1.2 2.38 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.64c.09 1.7 1.36 2.66 2.85 2.95V19h2.26v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.95-3.56z"/></svg>
          <span className="text-muted-foreground text-[10px] font-semibold">Wire</span>
        </div>
      );
    default:
      return <span className="text-muted-foreground text-xs">💳</span>;
  }
}

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
              <div key={item.productId} className="flex gap-3 p-3 sm:p-4 items-start sm:items-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-md bg-muted/50 overflow-hidden flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary leading-snug mb-0.5 truncate">{item.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">{formatPrice(item.priceCents)} each</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 border border-border rounded-full px-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatPrice(item.priceCents * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
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
                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                      selectedPayment === method
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <PaymentLogo method={method} />
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
