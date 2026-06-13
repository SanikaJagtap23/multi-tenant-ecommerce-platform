import { useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { FiExternalLink, FiLogOut, FiChevronDown } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import "./AdminHeader.css";

const PAGE_TITLES = {
  "/admin/dashboard":  { title: "Dashboard",  crumb: "Overview" },
  "/admin/customers":  { title: "Customers",  crumb: "User Management" },
  "/admin/vendors":    { title: "Vendors",    crumb: "User Management" },
  "/admin/stores":     { title: "Stores",     crumb: "Store Management" },
  "/admin/products":   { title: "Products",   crumb: "Product Management" },
  "/admin/orders":     { title: "Orders",     crumb: "Order Management" },
  "/admin/analytics":  { title: "Analytics",  crumb: "Reports" },
};

export default function AdminHeader() {
  const { pathname }   = useLocation();
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  const { userInfo }   = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const dropRef         = useRef(null);

  const meta    = PAGE_TITLES[pathname] || { title: "Admin", crumb: "Panel" };
  const initials = userInfo?.name
    ? userInfo.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  return (
    <header className="aheader">
      {/* Left — breadcrumb + title */}
      <div className="aheader__left">
        <p className="aheader__crumb">Admin Panel / {meta.crumb}</p>
        <h1 className="aheader__title">{meta.title}</h1>
      </div>

      {/* Right — actions */}
      <div className="aheader__right">
        <Link to="/" target="_blank" className="aheader__store-btn">
          <FiExternalLink size={14} />
          View Store
        </Link>

        {/* Admin avatar dropdown */}
        <div className="aheader__user-wrap" ref={dropRef}>
          <button
            className="aheader__user-btn"
            onClick={() => setOpen((o) => !o)}
          >
            <div className="aheader__avatar">{initials}</div>
            <span className="aheader__user-name">{userInfo?.name || "Admin"}</span>
            <FiChevronDown
              size={13}
              className={`aheader__chevron${open ? " aheader__chevron--open" : ""}`}
            />
          </button>

          {open && (
            <div className="aheader__dropdown">
              <div className="aheader__dropdown-info">
                <div className="aheader__dropdown-avatar">{initials}</div>
                <div>
                  <p className="aheader__dropdown-name">{userInfo?.name}</p>
                  <p className="aheader__dropdown-role">Super Admin</p>
                </div>
              </div>
              <div className="aheader__dropdown-divider" />
              <button className="aheader__dropdown-logout" onClick={handleLogout}>
                <FiLogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
