import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const VISITOR_KEY = "store_visitor_id";
const THROTTLE_MS = 60 * 1000;
const EXCLUDED_PREFIXES = ["/admin", "/manager-login", "/404"];

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

/**
 * Anonymous visit beacon. Fires once per page view (throttled to one per
 * minute per tab) so the owner can see real traffic and get notified about
 * genuinely new visitors.
 */
export default function VisitTracker() {
  const [location] = useLocation();
  const track = trpc.store.trackVisit.useMutation();
  const lastSent = useRef(0);

  useEffect(() => {
    if (EXCLUDED_PREFIXES.some(p => location.startsWith(p))) return;
    const now = Date.now();
    if (now - lastSent.current < THROTTLE_MS) return;
    lastSent.current = now;
    track.mutate({ visitorId: getVisitorId(), path: location });
  }, [location]);

  return null;
}
