import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { initCart, clearCart } from "./features/cart/cartSlice";

// Layout & guards
import Navbar from "./components/common/Navbar";
import VendorLayout from "./components/common/VendorLayout";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AuthModal from "./pages/auth/AuthModal";

// Customer pages
import HomePage from "./pages/customer/HomePage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import StorePage from "./pages/customer/StorePage";
import StoresPage from "./pages/customer/StoresPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";
import WishlistPage from "./pages/customer/WishlistPage";
import PaymentPage from "./pages/customer/PaymentPage";
import PaymentResultPage from "./pages/customer/PaymentResultPage";

// Profile (all roles)
import ProfilePage from "./pages/ProfilePage";

// Vendor pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import ManageStore from "./pages/vendor/ManageStore";
import ManageProducts from "./pages/vendor/ManageProducts";
import AddEditProduct from "./pages/vendor/AddEditProduct";
import VendorOrdersPage from "./pages/vendor/VendorOrdersPage";
import VendorOrderDetailPage from "./pages/vendor/VendorOrderDetailPage";
import VendorAnalyticsPage from "./pages/vendor/VendorAnalyticsPage";
import StockManagementPage from "./pages/vendor/StockManagementPage";
import VendorCouponsPage from "./pages/vendor/VendorCouponsPage";

// Admin pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminStoresPage from "./pages/admin/AdminStoresPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";

// Utility pages
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// Loads/clears the correct cart whenever the logged-in user changes
function CartInitializer() {
  const dispatch  = useDispatch();
  const { userInfo } = useSelector((s) => s.auth);

  useEffect(() => {
    if (userInfo?._id) {
      dispatch(initCart({ userId: userInfo._id }));
    } else {
      dispatch(clearCart());
    }
  }, [userInfo?._id, dispatch]);

  return null;
}

// Hides the customer Navbar + AuthModal on ALL /admin/* routes
function ConditionalShell({ children }) {
  const { pathname } = useLocation();
  const isAdminArea  = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminArea && <AuthModal />}
      {!isAdminArea && <Navbar />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <CartInitializer />

      <ConditionalShell>
        <Routes>
          {/* ── Admin Login (fully standalone — no Navbar) ───────────────── */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ── Admin Panel (sidebar layout, superadmin only) ─────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["superadmin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard"  element={<AdminDashboard />} />
              <Route path="/admin/customers"  element={<AdminUsersPage roleFilter="customer" />} />
              <Route path="/admin/vendors"    element={<AdminUsersPage roleFilter="vendor"   />} />
              <Route path="/admin/stores"     element={<AdminStoresPage />} />
              <Route path="/admin/products"   element={<AdminProductsPage />} />
              <Route path="/admin/orders"     element={<AdminOrdersPage />} />
              <Route path="/admin/analytics"  element={<AdminAnalyticsPage />} />
            </Route>
          </Route>

          {/* ── Public — customer shop ─────────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Old auth pages — redirect to home (modal handles login) */}
          <Route path="/login"           element={<Navigate to="/" replace />} />
          <Route path="/register"        element={<Navigate to="/" replace />} />
          <Route path="/vendor/login"    element={<Navigate to="/" replace />} />
          <Route path="/vendor/register" element={<Navigate to="/" replace />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Protected — any logged-in user ────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["customer", "vendor", "superadmin"]} />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* ── Customer-only routes ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
            <Route path="/checkout"              element={<CheckoutPage />} />
            <Route path="/payment"               element={<PaymentPage />} />
            <Route path="/payment/result"        element={<PaymentResultPage />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="/my-orders"             element={<MyOrdersPage />} />
            <Route path="/wishlist"              element={<WishlistPage />} />
          </Route>

          {/* ── Vendor routes ────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
            <Route element={<VendorLayout />}>
              <Route path="/vendor/dashboard"          element={<VendorDashboard />} />
              <Route path="/vendor/store"              element={<ManageStore />} />
              <Route path="/vendor/products"           element={<ManageProducts />} />
              <Route path="/vendor/products/new"       element={<AddEditProduct />} />
              <Route path="/vendor/products/edit/:id"  element={<AddEditProduct />} />
              <Route path="/vendor/orders"             element={<VendorOrdersPage />} />
              <Route path="/vendor/orders/:id"         element={<VendorOrderDetailPage />} />
              <Route path="/vendor/analytics"          element={<VendorAnalyticsPage />} />
              <Route path="/vendor/stock"              element={<StockManagementPage />} />
              <Route path="/vendor/coupons"            element={<VendorCouponsPage />} />
            </Route>
          </Route>

          {/* ── 404 ──────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ConditionalShell>
    </Router>
  );
}
