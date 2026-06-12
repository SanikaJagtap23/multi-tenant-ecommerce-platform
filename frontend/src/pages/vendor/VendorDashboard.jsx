import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMyStore } from "../../features/store/storeSlice";
import { fetchMyProducts } from "../../features/product/productSlice";
import { fetchVendorOrders } from "../../features/order/orderSlice";
import {
  FiShoppingBag, FiPackage, FiPlusCircle, FiSettings,
  FiShoppingCart, FiClock, FiArrowRight, FiTrendingUp,
  FiBox, FiAlertCircle,
} from "react-icons/fi";
import Spinner from "../../components/common/Spinner";
import "./VendorDashboard.css";

export default function VendorDashboard() {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.auth);
  const { myStore, loading: storeLoading } = useSelector((s) => s.store);
  const { myProducts } = useSelector((s) => s.product);
  const { vendorOrders } = useSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchMyStore());
    dispatch(fetchMyProducts());
    dispatch(fetchVendorOrders());
  }, [dispatch]);

  const activeProducts = myProducts.filter((p) => p.isActive).length;
  const pendingOrders = vendorOrders.filter((o) => o.status === "pending").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Total Products", value: myProducts.length, icon: <FiPackage />, color: "indigo" },
    { label: "Active Products", value: activeProducts, icon: <FiBox />, color: "emerald" },
    { label: "Total Orders", value: vendorOrders.length, icon: <FiShoppingCart />, color: "violet" },
    { label: "Pending Orders", value: pendingOrders, icon: <FiClock />, color: "amber" },
  ];

  const actions = [
    { to: "/vendor/products", icon: <FiPackage />, label: "Manage Products", desc: "Edit, activate or remove listings", color: "indigo" },
    { to: "/vendor/products/new", icon: <FiPlusCircle />, label: "Add New Product", desc: "List a new item for sale", color: "violet", primary: true },
    { to: "/vendor/orders", icon: <FiShoppingCart />, label: "View Orders", desc: "Process and track customer orders", color: "emerald" },
    { to: "/vendor/analytics", icon: <FiTrendingUp />, label: "Analytics", desc: "Sales trends and revenue insights", color: "amber" },
  ];

  return (
    <div className="vd-page">
      {/* Hero Banner */}
      <div className="vd-hero">
        <div className="vd-hero__blob vd-hero__blob--1" />
        <div className="vd-hero__blob vd-hero__blob--2" />
        <div className="vd-hero__content">
          <p className="vd-hero__greeting">{greeting},</p>
          <h1 className="vd-hero__name">{userInfo?.name}</h1>
          <p className="vd-hero__sub">Here&apos;s your store overview</p>
        </div>
        {myStore && (
          <Link to="/vendor/store" className="vd-hero__store-btn">
            <FiSettings size={14} /> Manage Store
          </Link>
        )}
      </div>

      {/* Store Card */}
      {storeLoading ? (
        <div className="vd-center"><Spinner /></div>
      ) : !myStore ? (
        <div className="vd-no-store">
          <div className="vd-no-store__icon">
            <FiAlertCircle size={22} />
          </div>
          <div className="vd-no-store__body">
            <h3 className="vd-no-store__title">No store yet</h3>
            <p className="vd-no-store__text">Create your store to start selling products.</p>
          </div>
          <Link to="/vendor/store" className="vd-no-store__cta">
            <FiPlusCircle size={14} /> Create Store
          </Link>
        </div>
      ) : (
        <div className="vd-store-card">
          {myStore.logo ? (
            <img src={myStore.logo} alt={myStore.name} className="vd-store-logo" />
          ) : (
            <div className="vd-store-logo-placeholder">{myStore.name[0]}</div>
          )}
          <div className="vd-store-info">
            <h2 className="vd-store-name">{myStore.name}</h2>
            <div className="vd-store-meta">
              <span className="vd-store-category">{myStore.category}</span>
              <span className={`vd-store-status ${myStore.isActive ? "vd-store-status--active" : "vd-store-status--inactive"}`}>
                {myStore.isActive ? "● Active" : "● Inactive"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="vd-stats">
        {stats.map((s) => (
          <div key={s.label} className={`vd-stat vd-stat--${s.color}`}>
            <div className="vd-stat__icon">{s.icon}</div>
            <div className="vd-stat__body">
              <p className="vd-stat__value">{s.value}</p>
              <p className="vd-stat__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="vd-section">
        <h2 className="vd-section-title">Quick Actions</h2>
        <div className="vd-actions">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`vd-action${a.primary ? " vd-action--primary" : ""}`}
            >
              <div className={`vd-action__icon vd-action__icon--${a.color}`}>{a.icon}</div>
              <div className="vd-action__text">
                <p className="vd-action__title">{a.label}</p>
                <p className="vd-action__desc">{a.desc}</p>
              </div>
              <FiArrowRight className="vd-action__arrow" size={15} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {vendorOrders.length > 0 && (
        <div className="vd-section">
          <div className="vd-section-header">
            <h2 className="vd-section-title">Recent Orders</h2>
            <Link to="/vendor/orders" className="vd-section-link">
              View all <FiArrowRight size={13} />
            </Link>
          </div>
          <div className="vd-recent-orders">
            {vendorOrders.slice(0, 5).map((order) => (
              <Link key={order._id} to={`/vendor/orders/${order._id}`} className="vd-order-row">
                <div className="vd-order-row__left">
                  <span className="vd-order-id">#{order._id.slice(-6).toUpperCase()}</span>
                  <span className="vd-order-customer">{order.customer?.name}</span>
                </div>
                <div className="vd-order-row__right">
                  <span className="vd-order-amount">₹{order.totalAmount?.toLocaleString()}</span>
                  <span className={`vd-order-badge vd-order-badge--${order.status}`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
