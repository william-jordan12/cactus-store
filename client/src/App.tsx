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
import { lazy, Suspense } from "react";

const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const ManagerLogin = lazy(() => import("./pages/ManagerLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Shop = lazy(() => import("./pages/Shop"));
const Reviews = lazy(() => import("./pages/Reviews"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/shop"} component={Shop} />
        <Route path={"/reviews"} component={Reviews} />
        <Route path={"/product/:id"} component={ProductDetail} />
        <Route path={"/cart"} component={Cart} />
        <Route path={"/checkout/success"} component={CheckoutSuccess} />
        <Route path={"/about"} component={About} />
        <Route path={"/faq"} component={FAQ} />
        <Route path={"/blog"} component={Blog} />
        <Route path={"/shipping"} component={Shipping} />
        <Route path={"/returns"} component={Returns} />
        <Route path={"/terms"} component={Terms} />
        <Route path={"/privacy"} component={Privacy} />

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
    </Suspense>
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
