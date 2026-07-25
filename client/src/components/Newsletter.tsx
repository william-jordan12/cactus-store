import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="border-t border-border">
      <div className="container py-14 md:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-black mb-1">Stay updated</h2>
          <p className="text-muted-foreground text-sm">
            New arrivals, rare species, and care notes — delivered monthly.
          </p>
        </div>
        <div className="w-full md:w-auto">
          {submitted ? (
            <p className="text-sm text-primary font-medium py-2">Thanks — you're on the list.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 md:w-64 bg-muted/60 border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/40 transition-all"
              />
              <button
                type="submit"
                className="bg-foreground text-background font-semibold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
