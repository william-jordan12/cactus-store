import { useState, useEffect } from "react";

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

  const handleChoice = (choice: "accepted" | "declined") => {
    localStorage.setItem(COOKIE_KEY, choice);
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] p-4 sm:p-6 pointer-events-none">
      <div className="bg-[#1d2327] text-white rounded-xl shadow-2xl max-w-2xl w-full ml-auto pointer-events-auto">
        <div className="p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-gray-300">
            We use cookies to keep the site running and improve your experience. No third-party tracking. By continuing to use this site, you agree to our use of cookies.
          </p>
          <a href="/privacy" className="text-xs text-gray-400 underline hover:text-gray-200 mt-2 inline-block transition-colors">
            Privacy Policy
          </a>
        </div>
        <div className="border-t border-white/10 px-5 sm:px-6 py-3 flex gap-3">
          <button
            onClick={() => handleChoice("declined")}
            className="flex-1 h-9 rounded-lg border border-white/20 text-sm font-medium text-gray-400 hover:text-white hover:border-white/40 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => handleChoice("accepted")}
            className="flex-1 h-9 rounded-lg bg-[oklch(0.47_0.11_155)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
