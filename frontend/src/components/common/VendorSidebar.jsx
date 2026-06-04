import { NavLink } from "react-router-dom";
import {
  FiGrid, FiPackage, FiPlusCircle, FiShoppingBag,
  FiShoppingCart, FiTrendingUp, FiBarChart2
} from "react-icons/fi";
import "./VendorSidebar.css";

const links = [
  { to: "/vendor/dashboard", icon: <FiGrid />, label: "Dashboard", end: true },
  { to: "/vendor/store", icon: <FiShoppingBag />, label: "My Store" },
  { to: "/vendor/products", icon: <FiPackage />, label: "Products" },
  { to: "/vendor/products/new", icon: <FiPlusCircle />, label: "Add Product" },
  { to: "/vendor/orders", icon: <FiShoppingCart />, label: "Orders" },
  { to: "/vendor/stock", icon: <FiBarChart2 />, label: "Stock" },
  { to: "/vendor/analytics", icon: <FiTrendingUp />, label: "Analytics" },
];

export default function VendorSidebar() {
  return (
    <aside className="vendor-sidebar">
      <p className="vendor-sidebar__heading">Vendor Panel</p>
      <nav className="vendor-sidebar__nav">
        {links.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive
                ? "vendor-sidebar__link vendor-sidebar__link--active"
                : "vendor-sidebar__link"
            }
          >
            {icon} {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
