import StoreLayout from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";

export default function CheckoutSuccess() {
  const searchString = useSearch();
  const sessionId = useMemo(() => new URLSearchParams(searchString).get("session_id") ?? "", [searchString]);
  const { clearCart } = useCart();

  const { data, isLoading } = trpc.store.checkoutStatus.useQuery(
    { sessionId },
    { enabled: Boolean(sessionId), refetchInterval: q => (q.state.data?.paymentStatus === "pending" ? 3000 : false) },
  );

  useEffect(() => {
    if (data?.paymentStatus === "paid") {
      clearCart();
    }
  }, [data?.paymentStatus, clearCart]);

  return (
    <StoreLayout>
      <div className="container py-24 flex flex-col items-center text-center max-w-lg">
        {isLoading || !data ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="font-display text-2xl font-black mb-2">Checking your payment…</h1>
          </>
        ) : data.paymentStatus === "paid" ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
            <h1 className="font-display text-2xl font-black mb-2">Payment successful!</h1>
            <p className="text-muted-foreground mb-2">
              Thank you for your order of <strong>{formatPrice(data.totalCents)}</strong>. A confirmation has been
              recorded and our team will process your order shortly.
            </p>
          </>
        ) : (
          <>
            <Clock className="h-16 w-16 text-amber-500 mb-4" />
            <h1 className="font-display text-2xl font-black mb-2">Payment processing</h1>
            <p className="text-muted-foreground mb-2">
              Your payment of <strong>{formatPrice(data.totalCents)}</strong> is being confirmed. This page refreshes
              automatically.
            </p>
          </>
        )}
        <Link href="/">
          <Button className="mt-6 uppercase font-bold tracking-wide">Back to Shop</Button>
        </Link>
      </div>
    </StoreLayout>
  );
}

