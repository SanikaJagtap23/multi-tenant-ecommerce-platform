import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import {
  FiGrid, FiPackage, FiPlusCircle, FiShoppingBag,
  FiShoppingCart, FiTrendingUp, FiBarChart2, FiLogOut, FiTag,
} from "react-icons/fi";
import "./VendorSidebar.css";

const links = [
  { to: "/vendor/dashboard", icon: <FiGrid />, label: "Dashboard", end: true },
  { to: "/vendor/store", icon: <FiShoppingBag />, label: "My Store" },
  { to: "/vendor/products", icon: <FiPackage />, label: "Products" },
  { to: "/vendor/products/new", icon: <FiPlusCircle />, label: "Add Product" },
  { to: "/vendor/orders", icon: <FiShoppingCart />, label: "Orders" },
  { to: "/vendor/stock", icon: <FiBarChart2 />, label: "Stock" },
  { to: "/vendor/coupons", icon: <FiTag />, label: "Coupons" },
  { to: "/vendor/analytics", icon: <FiTrendingUp />, label: "Analytics" },
];

export default function VendorSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const initials = userInfo?.name
    ? userInfo.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "V";

  return (
    <aside className="vsidebar">
      <div className="vsidebar__brand">
        <div className="vsidebar__brand-icon">
          <FiShoppingBag size={18} />
        </div>
        <span className="vsidebar__brand-text">Vendor Panel</span>
      </div>

      <nav className="vsidebar__nav">
        <p className="vsidebar__section-label">Menu</p>
        {links.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `vsidebar__link${isActive ? " vsidebar__link--active" : ""}`
            }
          >
            <span className="vsidebar__link-icon">{icon}</span>
            <span className="vsidebar__link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="vsidebar__footer">
        <div className="vsidebar__user">
          <div className="vsidebar__avatar">{initials}</div>
          <div className="vsidebar__user-info">
            <p className="vsidebar__user-name">{userInfo?.name || "Vendor"}</p>
            <p className="vsidebar__user-role">Vendor Account</p>
          </div>
        </div>
        <button onClick={handleLogout} className="vsidebar__logout-btn" title="Logout">
          <FiLogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
