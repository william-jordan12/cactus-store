import { Truck, ShieldCheck, Leaf, Headphones, CreditCard, Globe } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Ethically Propagated",
    text: "Every plant is greenhouse-grown. We never wild-harvest or damage natural populations.",
  },
  {
    icon: Truck,
    title: "Discreet Shipping",
    text: "Plain, unmarked packaging with protective insulation. Your privacy is our priority.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    text: "SSL-encrypted payments via Stripe. Your financial data is never stored on our servers.",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    text: "Real growers on our team. Get plant care advice and order help within hours, not days.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    text: "Pay with any major card or via WhatsApp for regions without card processing.",
  },
  {
    icon: Globe,
    title: "Worldwide Delivery",
    text: "We ship to 40+ countries with tracked options. Most orders arrive within 7-14 days.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-[oklch(0.97_0.005_155)] border-y border-border">
      <div className="container py-14">
        <div className="text-center mb-10">
          <p className="text-primary uppercase tracking-[0.25em] text-xs font-bold mb-2">
            Why Collectors Trust Us
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-black">
            Built for Plant Lovers
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 bg-white rounded-xl p-5 border border-border">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
