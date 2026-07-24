import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function ManagerLogin() {
  const { user, loading, isAuthenticated, logout, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setSubmitting(false);
        return;
      }
      await refresh();
      navigate("/admin");
    } catch {
      setError("Login failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[oklch(0.2_0.04_140)] px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-2xl p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-xl font-black mb-1">Store Manager Login</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Restricted area. Enter the manager password to manage products, orders and settings.
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
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              Sign out and try another account
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Back to store
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Enter manager password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="h-11"
            />
            {error && (
              <p className="text-sm text-destructive text-left">{error}</p>
            )}
            <Button
              className="w-full h-11 font-bold"
              onClick={handleLogin}
              disabled={submitting || !password}
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
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
