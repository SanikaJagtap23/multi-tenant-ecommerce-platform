import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import {
  FiGrid, FiUsers, FiShoppingBag, FiPackage,
  FiTrendingUp, FiLogOut, FiShield, FiBriefcase, FiBox,
} from "react-icons/fi";
import "./AdminSidebar.css";

const links = [
  { to: "/admin/dashboard",  icon: <FiGrid />,        label: "Dashboard",  end: true },
  { to: "/admin/customers",  icon: <FiUsers />,       label: "Customers" },
  { to: "/admin/vendors",    icon: <FiBriefcase />,   label: "Vendors" },
  { to: "/admin/stores",     icon: <FiShoppingBag />, label: "Stores" },
  { to: "/admin/products",   icon: <FiBox />,         label: "Products" },
  { to: "/admin/orders",     icon: <FiPackage />,     label: "Orders" },
  { to: "/admin/analytics",  icon: <FiTrendingUp />,  label: "Analytics" },
];

export default function AdminSidebar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { userInfo } = useSelector((s) => s.auth);

  const initials = userInfo?.name
    ? userInfo.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  return (
    <aside className="asidebar">
      {/* Brand */}
      <div className="asidebar__brand">
        <div className="asidebar__brand-icon">
          <FiShield size={18} />
        </div>
        <div>
          <p className="asidebar__brand-name">Tradezy</p>
          <p className="asidebar__brand-role">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="asidebar__nav">
        <p className="asidebar__section-label">Management</p>
        {links.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `asidebar__link${isActive ? " asidebar__link--active" : ""}`
            }
          >
            <span className="asidebar__link-icon">{icon}</span>
            <span className="asidebar__link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="asidebar__footer">
        <div className="asidebar__user">
          <div className="asidebar__avatar">{initials}</div>
          <div className="asidebar__user-info">
            <p className="asidebar__user-name">{userInfo?.name || "Admin"}</p>
            <p className="asidebar__user-role">Super Admin</p>
          </div>
        </div>
        <button onClick={handleLogout} className="asidebar__logout-btn" title="Logout">
          <FiLogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
