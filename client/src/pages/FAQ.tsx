import StoreLayout from "@/components/StoreLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How long does shipping take?",
    answer: "Domestic orders ship within 2-3 business days and typically arrive in 5-7 days. International orders take 7-21 business days depending on your location and customs processing.",
  },
  {
    question: "Do you ship live plants internationally?",
    answer: "Yes! We ship to over 40 countries. Each plant is carefully packaged with moisture barriers and insulation to survive the journey. Please check your local import regulations before ordering.",
  },
  {
    question: "What is your germination guarantee?",
    answer: "We guarantee that all our seeds are viable and freshly harvested. If your seeds fail to germinate within the expected timeframe, contact us with photos and we will replace your order free of charge.",
  },
  {
    question: "How do I care for my new cactus?",
    answer: "Most cacti prefer bright, indirect sunlight and well-draining soil. Water sparingly — let the soil dry completely between waterings. In winter, reduce watering significantly. Each order includes a care card specific to your species.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards through our secure Stripe checkout. For select regions, we also accept WhatsApp orders with mobile payment options.",
  },
  {
    question: "Can I return or exchange an item?",
    answer: "Due to the living nature of our products, we do not accept returns on live plants. However, if your order arrives damaged or doesn't match the description, please contact us within 48 hours and we will make it right.",
  },
  {
    question: "Do you offer wholesale pricing?",
    answer: "Yes, we offer volume discounts for nurseries, garden centers, and resellers. Contact us directly with your business details and estimated quantities for a custom quote.",
  },
  {
    question: "How can I track my order?",
    answer: "Once your order ships, you will receive an email with a tracking number. You can use this to follow your package's journey to your doorstep.",
  },
];

export default function FAQ() {
  return (
    <StoreLayout>
      <section className="bg-[oklch(0.25_0.05_140)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">
            Help Center
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 text-lg">
            Everything you need to know about ordering, shipping, and caring for your plants.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-2xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-left font-semibold py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </StoreLayout>
  );
}
