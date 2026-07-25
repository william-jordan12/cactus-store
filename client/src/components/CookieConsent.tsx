import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

const COOKIE_KEY = "store_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-lg font-black">We value your privacy</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-1">
            We use cookies to improve your experience on our site, analyze traffic, and personalize content. By clicking &quot;Accept&quot;, you consent to the use of all cookies.
          </p>
          <p className="text-muted-foreground text-xs">
            You can read more in our{" "}
            <a href="/privacy" className="text-primary underline hover:text-primary/80">Privacy Policy</a>.
          </p>
        </div>
        <div className="border-t border-border px-5 py-3 flex gap-3 bg-secondary/30">
          <button
            onClick={decline}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
