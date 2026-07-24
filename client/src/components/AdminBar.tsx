import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Gauge, LogOut, PlusCircle, Wrench } from "lucide-react";

/**
 * WordPress-style floating admin bar shown at the very top of the site
 * whenever an admin is logged in.
 */
export default function AdminBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-8 bg-[#1d2327] text-[#c3c4c7] text-[13px] flex items-center px-3 gap-1 shadow-md select-none">
      <div className="flex items-center gap-1.5 pr-3 border-r border-white/10 text-white">
        <Wrench className="h-3.5 w-3.5" />
        <span className="font-semibold hidden sm:inline">Store Admin</span>
      </div>
      <button
        onClick={() => navigate("/admin")}
        className="flex items-center gap-1.5 px-2.5 h-8 hover:bg-[#2c3338] hover:text-[#72aee6] transition-colors"
      >
        <Gauge className="h-3.5 w-3.5" />
        Go to Dashboard
      </button>
      <button
        onClick={() => navigate("/admin/products?new=1")}
        className="flex items-center gap-1.5 px-2.5 h-8 hover:bg-[#2c3338] hover:text-[#72aee6] transition-colors"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Add Product
      </button>
      <div className="flex-1" />
      <span className="hidden md:inline text-xs opacity-70 pr-2">
        Howdy, {user?.name || "admin"}
      </span>
      <button
        onClick={() => {
          logout();
          navigate("/");
        }}
        className="flex items-center gap-1.5 px-2.5 h-8 hover:bg-[#2c3338] hover:text-[#f86368] transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Log Out
      </button>
    </div>
  );
}
