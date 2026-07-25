import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import AdminGuard from "./components/AdminGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import ManagerLogin from "./pages/ManagerLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import AdminSettings from "./pages/admin/Settings";
import About from "./pages/About";
import FAQ from "./pages/FAQ";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/cart"} component={Cart} />
      <Route path={"/checkout/success"} component={CheckoutSuccess} />
      <Route path={"/about"} component={About} />
      <Route path={"/faq"} component={FAQ} />

      {/* Hidden admin login */}
      <Route path={"/manager-login"} component={ManagerLogin} />

      {/* Protected admin routes — non-admins are redirected to homepage */}
      <Route path={"/admin"}>
        <AdminGuard>
          <AdminDashboard />
        </AdminGuard>
      </Route>
      <Route path={"/admin/products"}>
        <AdminGuard>
          <AdminProducts />
        </AdminGuard>
      </Route>
      <Route path={"/admin/categories"}>
        <AdminGuard>
          <AdminCategories />
        </AdminGuard>
      </Route>
      <Route path={"/admin/orders"}>
        <AdminGuard>
          <AdminOrders />
        </AdminGuard>
      </Route>
      <Route path={"/admin/settings"}>
        <AdminGuard>
          <AdminSettings />
        </AdminGuard>
      </Route>
      {/* Any other /admin/* path also goes through the guard, then 404s inside */}
      <Route path={"/admin/*"}>
        <AdminGuard>
          <AdminDashboard />
        </AdminGuard>
      </Route>

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <CartProvider>
            <Toaster position="top-center" richColors />
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
