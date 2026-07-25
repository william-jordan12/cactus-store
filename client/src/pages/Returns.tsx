import StoreLayout from "@/components/StoreLayout";
import { RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { useSeo } from "@/lib/seo";

export default function Returns() {
  useSeo({ title: "Returns & Refunds", description: "Live plant return policy. If your order arrives damaged or DOA, contact us within 48 hours with photos for a full replacement or refund.", canonical: "/returns" });
  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">Policy</p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">Returns & Refunds</h1>
          <p className="text-white/70 text-lg">How we handle returns and refunds.</p>
        </div>
      </section>
      <section className="container py-16 max-w-3xl space-y-10">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">Live Plant Disclaimer</h3>
            <p className="text-sm text-amber-700">
              Due to the living and perishable nature of our products, we generally cannot accept returns on live plants.
              That said, if something goes wrong we'll make it right.
            </p>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Damaged or Defective Orders</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            If your order arrives damaged, DOA (dead on arrival), or doesn't match the product description, please contact us
            within <strong>48 hours of delivery</strong> with the following:
          </p>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> Your order number</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> Clear photos of the plant and packaging</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> A brief description of the issue</li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Resolution Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-4 bg-white border border-border rounded-xl p-5">
              <RotateCcw className="h-8 w-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Full Replacement</h3>
                <p className="text-sm text-muted-foreground">We will ship a replacement plant at no additional cost.</p>
              </div>
            </div>
            <div className="flex gap-4 bg-white border border-border rounded-xl p-5">
              <CheckCircle className="h-8 w-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Full Refund</h3>
                <p className="text-sm text-muted-foreground">If a replacement isn't available, we'll issue a full refund to your original payment method.</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Seed Orders</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Seed orders carry our <strong>germination guarantee</strong>. If your seeds fail to germinate within the expected timeframe,
            contact us with photos of your planting setup and we will replace your order free of charge.
          </p>
        </div>
      </section>
    </StoreLayout>
  );
}
