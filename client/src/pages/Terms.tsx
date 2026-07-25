import StoreLayout from "@/components/StoreLayout";

export default function Terms() {
  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">Legal</p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">Terms & Conditions</h1>
          <p className="text-white/70 text-lg">The fine print for ordering from us.</p>
        </div>
      </section>
      <section className="container py-16 max-w-3xl prose prose-sm text-muted-foreground">
        <p>Last updated: July 2026</p>

        <h2 className="font-display text-xl font-bold text-foreground">1. General</h2>
        <p>By accessing or using this website and placing an order, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use this website.</p>

        <h2 className="font-display text-xl font-bold text-foreground">2. Products</h2>
        <p>All plants are living organisms. Slight variations in size, shape, and color are natural and expected. Product photos are representative and may not exactly match the specimen you receive.</p>

        <h2 className="font-display text-xl font-bold text-foreground">3. Orders & Payment</h2>
        <p>Orders are processed once payment is confirmed. We accept all major credit and debit cards via our secure Stripe checkout. Prices are listed in USD and do not include import duties or taxes for international orders.</p>

        <h2 className="font-display text-xl font-bold text-foreground">4. Shipping</h2>
        <p>We ship worldwide. Risk of loss transfers to you upon delivery to the carrier. Please refer to our <a href="/shipping" className="text-primary underline">Shipping & Delivery</a> page for full details.</p>

        <h2 className="font-display text-xl font-bold text-foreground">5. Returns & Refunds</h2>
        <p>Due to the living nature of our products, returns are limited. Please refer to our <a href="/returns" className="text-primary underline">Returns & Refunds Policy</a> page for full details.</p>

        <h2 className="font-display text-xl font-bold text-foreground">6. Accuracy of Information</h2>
        <p>We do our best to keep product descriptions and care instructions accurate. We are not liable for damages resulting from incorrect care practices followed by the customer.</p>

        <h2 className="font-display text-xl font-bold text-foreground">7. Limitation of Liability</h2>
        <p>Our total liability for any order shall not exceed the purchase price of the products in that order. We are not responsible for indirect, incidental, or consequential damages.</p>

        <h2 className="font-display text-xl font-bold text-foreground">8. Governing Law</h2>
        <p>These Terms are governed by the laws of the United States. Any disputes shall be resolved in the courts of the applicable jurisdiction.</p>

        <h2 className="font-display text-xl font-bold text-foreground">9. Changes</h2>
        <p>We reserve the right to update these Terms at any time. Continued use of the website after changes constitutes acceptance of the updated Terms.</p>
      </section>
    </StoreLayout>
  );
}
