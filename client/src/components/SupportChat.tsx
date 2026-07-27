import { MessageCircle, X, Send, Headphones, Mail, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const { data: settings } = trpc.store.settings.useQuery();
  const contactEmail = settings?.contactEmail || "peyoteseedsfarm@gmail.com";

  useEffect(() => {
    if (open) {
      setTimeout(() => nameRef.current?.focus(), 200);
      setSent(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSending(true);

    // Build mailto link with the support message
    const subject = encodeURIComponent(`Support Request from ${name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`
    );
    const mailtoUrl = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

    // Open the mail client
    window.location.href = mailtoUrl;

    // Show success state after a short delay
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    }, 1000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-5 z-[200] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          open
            ? "bg-foreground text-background rotate-0"
            : "bg-[oklch(0.47_0.11_155)] text-white"
        }`}
        aria-label={open ? "Close support" : "Open support"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[200] w-[360px] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          style={{ height: "min(520px, calc(100vh - 8rem))" }}
        >
          {/* Header */}
          <div className="bg-[oklch(0.47_0.11_155)] text-white px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">Customer Support</div>
              <div className="text-white/70 text-xs">Send us a message anytime</div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-[oklch(0.985_0.002_155)]">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Message Ready!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your email client has opened with the message. Send it to reach our team at <span className="font-medium text-foreground">{contactEmail}</span>.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm font-medium text-[oklch(0.47_0.11_155)] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="text-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-[oklch(0.47_0.11_155)]/10 flex items-center justify-center mx-auto mb-2">
                    <Mail className="h-5 w-5 text-[oklch(0.47_0.11_155)]" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your message will be sent directly to our support email.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Name</label>
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-[oklch(0.47_0.11_155)] transition-colors bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-[oklch(0.47_0.11_155)] transition-colors bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-[oklch(0.47_0.11_155)] transition-colors resize-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || !email.trim() || !message.trim() || sending}
                  className="w-full h-10 rounded-lg bg-[oklch(0.47_0.11_155)] text-white flex items-center justify-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
