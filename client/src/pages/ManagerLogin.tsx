import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Hidden admin login route at /manager-login.
 * Admins authenticate via secure OAuth; non-admin accounts are rejected.
 */
export default function ManagerLogin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [loading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[oklch(0.2_0.04_140)] px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-2xl p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-xl font-black mb-1">Store Manager Login</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Restricted area. Sign in with the store owner account to manage products, orders and settings.
        </p>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isAuthenticated && user?.role !== "admin" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3 text-left">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>This account does not have manager access.</span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                logout();
              }}
            >
              Sign out and try another account
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Back to store
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button className="w-full h-11 font-bold" onClick={() => startLogin()}>
              Sign in securely
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Back to store
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
