import { Mail } from "lucide-react";
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
    <section className="bg-[oklch(0.47_0.11_155)]">
      <div className="container py-14 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
            <Mail className="h-6 w-6 text-white/70" />
            <h2 className="font-display text-xl md:text-2xl font-black text-white">
              Stay in the Loop
            </h2>
          </div>
          <p className="text-white/70 text-sm max-w-md">
            Get notified about new arrivals, rare species drops, and exclusive care tips.
            No spam — just the good stuff.
          </p>
        </div>
        <div className="w-full md:w-auto">
          {submitted ? (
            <div className="bg-white/10 backdrop-blur-sm text-white rounded-xl px-6 py-4 text-center font-semibold">
              Thanks for subscribing!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 md:w-72 bg-white/15 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 text-sm outline-none focus:border-white/50 transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-[oklch(0.47_0.11_155)] font-bold uppercase tracking-wide px-6 py-3 rounded-lg text-sm hover:bg-white/90 transition-colors shrink-0"
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
