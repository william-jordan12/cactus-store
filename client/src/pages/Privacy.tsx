import StoreLayout from "@/components/StoreLayout";

export default function Privacy() {
  return (
    <StoreLayout>
      <section className="bg-[oklch(0.22_0.04_155)] text-white py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-white/60 uppercase tracking-[0.25em] text-xs font-bold mb-3">Legal</p>
          <h1 className="font-display text-3xl md:text-5xl font-black mb-4">Privacy Policy</h1>
          <p className="text-white/70 text-lg">Your privacy matters to us.</p>
        </div>
      </section>
      <section className="container py-16 max-w-3xl prose prose-sm text-muted-foreground">
        <p>Last updated: July 2026</p>

        <h2 className="font-display text-xl font-bold text-foreground">1. Information We Collect</h2>
        <p>We collect personal information you voluntarily provide when placing an order, including your name, email address, shipping address, and payment information. Payment details are processed securely by Stripe and are never stored on our servers.</p>

        <h2 className="font-display text-xl font-bold text-foreground">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To process and fulfill your orders</li>
          <li>To communicate order updates and shipping notifications</li>
          <li>To respond to customer support inquiries</li>
          <li>To improve our website and services</li>
        </ul>

        <h2 className="font-display text-xl font-bold text-foreground">3. Data Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We share information only with payment processors (Stripe) and shipping carriers as necessary to fulfill your orders.</p>

        <h2 className="font-display text-xl font-bold text-foreground">4. Cookies</h2>
        <p>We use essential cookies to maintain your shopping cart session and authentication status. These are necessary for the website to function and do not require consent.</p>

        <h2 className="font-display text-xl font-bold text-foreground">5. Data Security</h2>
        <p>We implement industry-standard SSL encryption and security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

        <h2 className="font-display text-xl font-bold text-foreground">6. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at the email address provided on our website.</p>

        <h2 className="font-display text-xl font-bold text-foreground">7. Data Retention</h2>
        <p>We retain your order information for as long as necessary to provide services and comply with legal obligations. You may request deletion of your account data at any time.</p>

        <h2 className="font-display text-xl font-bold text-foreground">8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy periodically. The latest version will always be posted on this page with the updated date.</p>
      </section>
    </StoreLayout>
  );
}
