import { Truck, Leaf, ShieldCheck } from "lucide-react";

const items = [
  { icon: Leaf, label: "Greenhouse grown, never wild-harvested" },
  { icon: Truck, label: "Discreet packaging, tracked worldwide" },
  { icon: ShieldCheck, label: "SSL-encrypted checkout" },
];

export default function WhyChooseUs() {
  return (
    <section className="border-y border-border">
      <div className="container py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
              <item.icon className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
