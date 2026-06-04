import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import {
  FiShoppingBag, FiLogOut, FiGrid, FiShoppingCart,
  FiPackage, FiSearch, FiMenu, FiX, FiChevronDown,
  FiMail, FiUser, FiHeart,
} from "react-icons/fi";
import "./Navbar.css";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Electronics", value: "Electronics" },
  { label: "Fashion", value: "Fashion & Clothing" },
  { label: "Home & Garden", value: "Home & Garden" },
  { label: "Sports", value: "Sports & Outdoors" },
  { label: "Books", value: "Books & Media" },
  { label: "Health", value: "Health & Beauty" },
  { label: "Toys", value: "Toys & Games" },
  { label: "Food", value: "Food & Beverages" },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.cart);
  const { ids: wishlistIds } = useSelector((s) => s.wishlist);

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlistIds.length;
  const isVendor = userInfo?.role === "vendor";
  const isAdmin = userInfo?.role === "superadmin";
  const isCustomer = userInfo?.role === "customer";
  const isGuest = !userInfo;
  const showShopNav = isGuest || isCustomer;
  const avatarRole = isVendor ? "vendor" : isAdmin ? "admin" : "customer";

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logout());
    toast.success("You've been logged out.");
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const roleLabel =
    userInfo?.role === "superadmin" ? "Admin" :
    userInfo?.role ? userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1) : "";

  return (
    <>
      {/* Announcement strip */}
      <div className="navbar-announcement">
        🚚 Free shipping on orders above ₹500 &nbsp;·&nbsp; 🛡️ Secure payments &nbsp;·&nbsp; 🔄 Easy 7-day returns
      </div>

      {/* Main navbar */}
      <header className="navbar-header">
        <div className="navbar-inner">
          <div className="navbar-row">

            {/* Logo */}
            <Link
              to={isVendor ? "/vendor/dashboard" : isAdmin ? "/admin/dashboard" : "/"}
              className="navbar-logo"
            >
              <div className="navbar-logo-icon">
                <FiShoppingBag size={18} />
              </div>
              <span className="navbar-logo-text">
                Trade<span className="navbar-logo-accent">zy</span>
              </span>
            </Link>

            {/* Search — only for customer/guest */}
            {showShopNav && (
              <form onSubmit={handleSearch} className="navbar-search">
                <div className="navbar-search-wrap">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, brands, categories..."
                    className="navbar-search-input"
                  />
                  <button type="submit" className="navbar-search-btn">
                    <FiSearch size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Vendor/Admin: dashboard link fills the gap */}
            {(isVendor || isAdmin) && (
              <div className="navbar-dashboard-area">
                <Link
                  to={isVendor ? "/vendor/dashboard" : "/admin/dashboard"}
                  className="navbar-dashboard-link"
                >
                  <FiGrid size={15} />
                  {isVendor ? "Vendor Dashboard" : "Admin Dashboard"}
                </Link>
              </div>
            )}

            {/* Right side actions */}
            <div className="navbar-actions">

              {/* Cart — customers & guests */}
              {showShopNav && (
                <Link to="/cart" className="navbar-cart-btn">
                  <div style={{ position: "relative" }}>
                    <FiShoppingCart size={22} />
                    {cartCount > 0 && (
                      <span className="navbar-cart-badge">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </div>
                  <span className="navbar-icon-label">Cart</span>
                </Link>
              )}

              {/* My Orders — customers */}
              {isCustomer && (
                <Link to="/my-orders" className="navbar-orders-btn">
                  <FiPackage size={22} />
                  <span>Orders</span>
                </Link>
              )}

              {/* Wishlist — customers */}
              {isCustomer && (
                <Link to="/wishlist" className="navbar-wishlist-btn">
                  <div style={{ position: "relative" }}>
                    <FiHeart size={22} />
                    {wishlistCount > 0 && (
                      <span className="navbar-wishlist-badge">{wishlistCount}</span>
                    )}
                  </div>
                  <span className="navbar-icon-label">Wishlist</span>
                </Link>
              )}

              {/* Profile chip + dropdown — logged-in users */}
              {userInfo && (
                <div className="navbar-profile-wrap" ref={profileRef}>
                  <button
                    className={`navbar-user-chip${profileOpen ? " navbar-user-chip--open" : ""}`}
                    onClick={() => setProfileOpen((o) => !o)}
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <div className={`navbar-avatar navbar-avatar--${avatarRole}`}>
                      {userInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="navbar-user-info">
                      <p className="navbar-user-name">{userInfo.name}</p>
                      <p className={`navbar-user-role navbar-user-role--${avatarRole}`}>
                        {roleLabel}
                      </p>
                    </div>
                    <FiChevronDown
                      size={13}
                      className={`navbar-profile-chevron${profileOpen ? " navbar-profile-chevron--open" : ""}`}
                    />
                  </button>

                  {/* Profile dropdown */}
                  {profileOpen && (
                    <div className="navbar-profile-dropdown">
                      {/* User summary */}
                      <div className="navbar-profile-dropdown__header">
                        <div className={`navbar-profile-dropdown__avatar navbar-avatar--${avatarRole}`}>
                          {userInfo.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="navbar-profile-dropdown__meta">
                          <p className="navbar-profile-dropdown__name">{userInfo.name}</p>
                          {userInfo.email && (
                            <p className="navbar-profile-dropdown__email">
                              <FiMail size={11} />
                              {userInfo.email}
                            </p>
                          )}
                          <span className={`navbar-profile-dropdown__badge navbar-profile-dropdown__badge--${avatarRole}`}>
                            {roleLabel}
                          </span>
                        </div>
                      </div>

                      <div className="navbar-profile-dropdown__divider" />

                      {/* Quick links */}
                      <Link
                        to="/profile"
                        className="navbar-profile-dropdown__link"
                        onClick={() => setProfileOpen(false)}
                      >
                        <FiUser size={14} /> My Profile
                      </Link>

                      {isCustomer && (
                        <Link
                          to="/my-orders"
                          className="navbar-profile-dropdown__link"
                          onClick={() => setProfileOpen(false)}
                        >
                          <FiPackage size={14} /> My Orders
                        </Link>
                      )}

                      {isCustomer && (
                        <Link
                          to="/wishlist"
                          className="navbar-profile-dropdown__link"
                          onClick={() => setProfileOpen(false)}
                        >
                          <FiHeart size={14} /> My Wishlist
                        </Link>
                      )}
                      {isVendor && (
                        <Link
                          to="/vendor/dashboard"
                          className="navbar-profile-dropdown__link"
                          onClick={() => setProfileOpen(false)}
                        >
                          <FiGrid size={14} /> Vendor Dashboard
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="navbar-profile-dropdown__link"
                          onClick={() => setProfileOpen(false)}
                        >
                          <FiGrid size={14} /> Admin Dashboard
                        </Link>
                      )}

                      <div className="navbar-profile-dropdown__divider" />

                      <button
                        className="navbar-profile-dropdown__logout"
                        onClick={handleLogout}
                      >
                        <FiLogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Auth buttons — guests only */}
              {!userInfo && (
                <div className="navbar-auth-guest">
                  <Link to="/login" className="navbar-signin-btn">Sign In</Link>
                  <Link to="/register" className="navbar-register-btn">Register</Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="navbar-mobile-toggle"
              >
                {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Category strip — only customer/guest */}
        {showShopNav && (
          <div className="navbar-categories">
            <div className="navbar-categories-inner">
              <div className="navbar-categories-row">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value || "all"}
                    to={cat.value ? `/?category=${encodeURIComponent(cat.value)}` : "/"}
                    className="navbar-category-link"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div className="navbar-mobile-menu">
            {showShopNav && (
              <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="navbar-mobile-search">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="navbar-mobile-search-input"
                />
                <button type="submit" className="navbar-mobile-search-btn">Go</button>
              </form>
            )}
            {isCustomer && (
              <Link to="/my-orders" onClick={() => setMobileOpen(false)} className="navbar-mobile-link">
                <FiPackage /> My Orders
              </Link>
            )}
            {userInfo && (
              <button className="navbar-mobile-logout" onClick={handleLogout}>
                <FiLogOut size={14} /> Sign Out
              </button>
            )}
            {!userInfo && (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="navbar-mobile-link">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="navbar-mobile-link">Register</Link>
              </>
            )}
          </div>
        )}
      </header>
    </>
  );
}
