import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Wraps all /admin/* routes. Unauthenticated or non-admin visitors are
 * silently redirected back to the public homepage.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = isAuthenticated && user?.role === "admin";

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
