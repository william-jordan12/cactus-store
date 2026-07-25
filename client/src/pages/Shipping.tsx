import StoreLayout from "@/components/StoreLayout";
import { Truck, Package, Clock, Globe } from "lucide-react";
import { useSeo } from "@/lib/seo";

export default function Shipping() {
  useSeo({ title: "Shipping & Delivery", description: "We ship worldwide via USPS. Domestic orders arrive in 5-7 business days. International orders take 7-21 days. Discreet packaging on all orders.", canonical: "/shipping" });
  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">Shipping</p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">Shipping & Delivery</h1>
          <p className="text-white/70 text-lg">How we get your plants to you safely.</p>
        </div>
      </section>
      <section className="container py-16 max-w-3xl space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex gap-4 bg-white border border-border rounded-xl p-5">
            <Truck className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Domestic Shipping</h3>
              <p className="text-sm text-muted-foreground">Orders ship within 2-3 business days via USPS. Delivery typically takes 5-7 business days. Tracking is included on all orders.</p>
            </div>
          </div>
          <div className="flex gap-4 bg-white border border-border rounded-xl p-5">
            <Globe className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">International Shipping</h3>
              <p className="text-sm text-muted-foreground">We ship to 40+ countries worldwide. International orders take 7-21 business days depending on customs processing in your region.</p>
            </div>
          </div>
          <div className="flex gap-4 bg-white border border-border rounded-xl p-5">
            <Package className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Discreet Packaging</h3>
              <p className="text-sm text-muted-foreground">All orders ship in plain, unmarked packaging. No company logos, no product descriptions on the exterior. Your privacy is guaranteed.</p>
            </div>
          </div>
          <div className="flex gap-4 bg-white border border-border rounded-xl p-5">
            <Clock className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Processing Times</h3>
              <p className="text-sm text-muted-foreground">Orders placed before 12pm EST ship the same business day when possible. Weekend orders ship on Monday.</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Important Notes</h2>
          <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> We are not responsible for delays caused by customs or local postal services.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> Please double-check your shipping address at checkout. We cannot redirect packages after dispatch.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> Extreme weather conditions may delay shipments to protect the health of live plants.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> For express shipping options, contact us before placing your order.</li>
          </ul>
        </div>
      </section>
    </StoreLayout>
  );
}
