import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout & guards
import Navbar from "./components/common/Navbar";
import VendorLayout from "./components/common/VendorLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AuthModal from "./pages/auth/AuthModal";


// Customer pages
import HomePage from "./pages/customer/HomePage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderConfirmationPage from "./pages/customer/OrderConfirmationPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";
import WishlistPage from "./pages/customer/WishlistPage";

// Profile (all roles)
import ProfilePage from "./pages/ProfilePage";

// Vendor pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import ManageStore from "./pages/vendor/ManageStore";
import ManageProducts from "./pages/vendor/ManageProducts";
import AddEditProduct from "./pages/vendor/AddEditProduct";
import VendorOrdersPage from "./pages/vendor/VendorOrdersPage";
import VendorAnalyticsPage from "./pages/vendor/VendorAnalyticsPage";
import StockManagementPage from "./pages/vendor/StockManagementPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";

// Utility pages
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AuthModal />
      <Navbar />

      <Routes>
        {/* Public — customer shop */}
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Old auth pages — redirect to home (modal handles login) */}
        <Route path="/login"           element={<Navigate to="/" replace />} />
        <Route path="/register"        element={<Navigate to="/" replace />} />
        <Route path="/vendor/login"    element={<Navigate to="/" replace />} />
        <Route path="/vendor/register" element={<Navigate to="/" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected — any logged-in user */}
        <Route element={<ProtectedRoute allowedRoles={["customer", "vendor", "superadmin"]} />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Customer-only routes */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>

        {/* Vendor routes */}
        <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
          <Route element={<VendorLayout />}>
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/store" element={<ManageStore />} />
            <Route path="/vendor/products" element={<ManageProducts />} />
            <Route path="/vendor/products/new" element={<AddEditProduct />} />
            <Route path="/vendor/products/edit/:id" element={<AddEditProduct />} />
            <Route path="/vendor/orders" element={<VendorOrdersPage />} />
            <Route path="/vendor/analytics" element={<VendorAnalyticsPage />} />
            <Route path="/vendor/stock" element={<StockManagementPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={["superadmin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
