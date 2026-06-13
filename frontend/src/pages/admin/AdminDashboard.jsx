import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminStats } from "../../features/admin/adminSlice";
import Spinner from "../../components/common/Spinner";
import {
  FiUsers, FiBriefcase, FiShoppingBag, FiPackage,
  FiDollarSign, FiAlertTriangle, FiArrowRight, FiTrendingUp,
  FiShield,
} from "react-icons/fi";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((s) => s.admin);
  const { userInfo }       = useSelector((s) => s.auth);

  useEffect(() => { dispatch(fetchAdminStats()); }, [dispatch]);

  const kpis = stats ? [
    { label: "Total Revenue",   value: `₹${Number(stats.totalRevenue || 0).toLocaleString("en-IN")}`, icon: FiDollarSign, clr: "#059669", bg: "#d1fae5", to: "/admin/analytics" },
    { label: "Total Orders",    value: stats.totalOrders    || 0, icon: FiPackage,     clr: "#2563eb", bg: "#dbeafe", to: "/admin/orders"    },
    { label: "Customers",       value: stats.totalCustomers || 0, icon: FiUsers,       clr: "#4f46e5", bg: "#e0e7ff", to: "/admin/customers" },
    { label: "Vendors",         value: stats.totalVendors   || 0, icon: FiBriefcase,   clr: "#7c3aed", bg: "#f3e8ff", to: "/admin/vendors"   },
    { label: "Stores",          value: stats.totalStores    || 0, icon: FiShoppingBag, clr: "#d97706", bg: "#fef9c3", to: "/admin/stores"    },
    { label: "Products",        value: stats.totalProducts  || 0, icon: FiPackage,     clr: "#e11d48", bg: "#ffe4e6", to: "/admin/products"  },
  ] : [];

  const quickActions = [
    { label: "Manage Customers", desc: "View, ban & change roles", to: "/admin/customers", icon: FiUsers,        clr: "#4f46e5", bg: "#e0e7ff" },
    { label: "Manage Vendors",   desc: "Approve, suspend vendors",  to: "/admin/vendors",   icon: FiBriefcase,   clr: "#7c3aed", bg: "#f3e8ff" },
    { label: "Manage Stores",    desc: "Activate or freeze stores", to: "/admin/stores",    icon: FiShoppingBag, clr: "#d97706", bg: "#fef9c3" },
    { label: "View All Orders",  desc: "Platform-wide orders",      to: "/admin/orders",    icon: FiPackage,     clr: "#2563eb", bg: "#dbeafe" },
    { label: "Analytics",        desc: "Revenue & growth charts",   to: "/admin/analytics", icon: FiTrendingUp,  clr: "#059669", bg: "#d1fae5" },
  ];

  return (
    <div className="adash">

      {/* Hero banner */}
      <div className="adash__hero">
        <div className="adash__hero-left">
          <div className="adash__hero-icon">
            <FiShield size={22} />
          </div>
          <div>
            <h2 className="adash__hero-title">
              Welcome back, {userInfo?.name?.split(" ")[0]} 👋
            </h2>
            <p className="adash__hero-sub">
              Here's what's happening on your platform today.
            </p>
          </div>
        </div>
        {stats && (stats.bannedUsers > 0 || stats.inactiveStores > 0) && (
          <div className="adash__hero-alert">
            <FiAlertTriangle size={14} />
            <span>
              {[
                stats.bannedUsers     > 0 && `${stats.bannedUsers} banned`,
                stats.inactiveStores  > 0 && `${stats.inactiveStores} inactive stores`,
              ].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}
      </div>

      {/* KPIs */}
      {loading && !stats ? (
        <div className="adash__spinner"><Spinner /></div>
      ) : stats ? (
        <>
          <div className="adash__kpi-grid">
            {kpis.map(({ label, value, icon: Icon, clr, bg, to }) => (
              <Link key={label} to={to} className="adash__kpi">
                <div className="adash__kpi-icon" style={{ background: bg, color: clr }}>
                  <Icon size={20} />
                </div>
                <div className="adash__kpi-body">
                  <p className="adash__kpi-val">{value}</p>
                  <p className="adash__kpi-lbl">{label}</p>
                </div>
                <FiArrowRight className="adash__kpi-arrow" size={14} />
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="adash__section">
            <div className="adash__section-header">
              <h2 className="adash__section-title">Quick Actions</h2>
              <p className="adash__section-sub">Navigate to any management area</p>
            </div>
            <div className="adash__qa-grid">
              {quickActions.map(({ label, desc, to, icon: Icon, clr, bg }) => (
                <Link key={to} to={to} className="adash__qa">
                  <div className="adash__qa-icon" style={{ background: bg, color: clr }}>
                    <Icon size={24} />
                  </div>
                  <div className="adash__qa-body">
                    <p className="adash__qa-label">{label}</p>
                    <p className="adash__qa-desc">{desc}</p>
                  </div>
                  <div className="adash__qa-arrow" style={{ color: clr }}>
                    <FiArrowRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
