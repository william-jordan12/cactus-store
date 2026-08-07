import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
  }
}

/**
 * Injects the Tawk.to live chat widget script once per page load.
 * Rendered as a guard inside a useEffect so React re-renders and Vite HMR
 * never produce duplicate widget tags.
 */
export default function TawkChat() {
  useEffect(() => {
    if (document.getElementById("tawk-to-script")) return;

    (window as Window & typeof globalThis).Tawk_API =
      (window as Window & typeof globalThis).Tawk_API || {};
    (window as Window & { Tawk_LoadStart?: Date }).Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = "tawk-to-script";
    script.async = true;
    script.src = "https://embed.tawk.to/6a76363868c7d71d495378b2/default";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);
  }, []);

  return null;
}
