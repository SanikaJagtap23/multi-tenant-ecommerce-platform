import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, register, clearError, logout } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import { FiShoppingBag, FiAlertCircle, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import "./VendorAuthPage.css";

export default function VendorAuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo, loading, error } = useSelector((state) => state.auth);

  const defaultMode = location.pathname === "/vendor/register" ? "register" : "login";
  const [authMode, setAuthMode] = useState(defaultMode);
  const [formError, setFormError] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "", email: "", password: "", role: "vendor",
  });

  useEffect(() => {
    if (!userInfo) return;

    if (userInfo.role === "vendor") {
      // Correct portal — proceed
      toast.success(`Welcome back, ${userInfo.name}!`);
      navigate("/vendor/dashboard", { replace: true });
    } else if (userInfo.role === "customer") {
      // Wrong portal — block and show error
      dispatch(logout());
      setFormError("This account is registered as a Customer. Please sign in at the Customer Login portal.");
      toast.error("Wrong portal — use the Customer Login.");
    } else if (userInfo.role === "superadmin") {
      dispatch(logout());
      setFormError("Admin accounts cannot sign in here.");
      toast.error("Admin accounts cannot use this portal.");
    }
  }, [userInfo]);

  useEffect(() => {
    if (error) {
      setFormError(error);
      dispatch(clearError());
    }
  }, [error]);

  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleRegisterChange = (e) =>
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    dispatch(login(loginData));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (registerData.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    dispatch(register(registerData));
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setFormError("");
  };

  return (
    <div className="vendor-auth-page">
      {/* Background decorations */}
      <div className="vendor-auth-bg-dots" />
      <div className="vendor-auth-bg-blob vendor-auth-bg-blob--top" />
      <div className="vendor-auth-bg-blob vendor-auth-bg-blob--bottom" />

      <div className="vendor-auth-container">

        {/* Back to shop */}
        <Link to="/" className="vendor-auth-back-link">
          <FiArrowLeft size={15} />
          Back to Shop
        </Link>

        {/* Branding */}
        <div className="vendor-auth-brand">
          <div className="vendor-auth-icon-wrap">
            <FiShoppingBag />
          </div>
          <h1 className="vendor-auth-title">
            {authMode === "login" ? "Vendor Sign In" : "Become a Vendor"}
          </h1>
          <p className="vendor-auth-subtitle">
            {authMode === "login"
              ? "Access your store and manage products"
              : "Create your store and start selling today"}
          </p>
        </div>

        {/* Card */}
        <div className="vendor-auth-card">
          <div className="vendor-auth-card-body">

            {/* Toggle */}
            <div className="vendor-auth-toggle">
              <button
                onClick={() => switchMode("login")}
                className={`vendor-auth-toggle-btn ${authMode === "login" ? "vendor-auth-toggle-btn--active" : ""}`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode("register")}
                className={`vendor-auth-toggle-btn ${authMode === "register" ? "vendor-auth-toggle-btn--active" : ""}`}
              >
                Register
              </button>
            </div>

            {/* Inline error */}
            {formError && (
              <div className="vendor-auth-error">
                <FiAlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="vendor-auth-form">
                <div className="vendor-auth-form__field">
                  <label className="vendor-auth-label">
                    Email Address
                  </label>
                  <input
                    type="email" name="email"
                    value={loginData.email} onChange={handleLoginChange}
                    required placeholder="vendor@example.com"
                    className="vendor-auth-input"
                  />
                </div>
                <div className="vendor-auth-form__field">
                  <label className="vendor-auth-label">
                    Password
                  </label>
                  <input
                    type="password" name="password"
                    value={loginData.password} onChange={handleLoginChange}
                    required placeholder="••••••••"
                    className="vendor-auth-input"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="vendor-auth-submit"
                >
                  {loading && <Spinner size="sm" />}
                  {loading ? "Signing in…" : "Sign In to Vendor Portal"}
                </button>
                <p className="vendor-auth-form__footer">
                  New vendor?{" "}
                  <button type="button" onClick={() => switchMode("register")}
                    className="vendor-auth-form__switch-btn">
                    Create your store
                  </button>
                </p>
              </form>
            ) : (
              /* ── REGISTER FORM ── */
              <form onSubmit={handleRegisterSubmit} className="vendor-auth-form">
                <div className="vendor-auth-form__field">
                  <label className="vendor-auth-label">
                    Full Name
                  </label>
                  <input
                    type="text" name="name"
                    value={registerData.name} onChange={handleRegisterChange}
                    required placeholder="Your Business Name"
                    className="vendor-auth-input"
                  />
                </div>
                <div className="vendor-auth-form__field">
                  <label className="vendor-auth-label">
                    Email Address
                  </label>
                  <input
                    type="email" name="email"
                    value={registerData.email} onChange={handleRegisterChange}
                    required placeholder="vendor@example.com"
                    className="vendor-auth-input"
                  />
                </div>
                <div className="vendor-auth-form__field">
                  <label className="vendor-auth-label">
                    Password
                  </label>
                  <input
                    type="password" name="password"
                    value={registerData.password} onChange={handleRegisterChange}
                    required placeholder="Min. 6 characters"
                    className="vendor-auth-input"
                  />
                </div>
                {/* Role locked badge */}
                <div className="vendor-auth-role-badge">
                  <FiShoppingBag size={15} />
                  <span>
                    Registering as Vendor — you can create &amp; manage a store
                  </span>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="vendor-auth-submit"
                >
                  {loading && <Spinner size="sm" />}
                  {loading ? "Creating account…" : "Create Vendor Account"}
                </button>
                <p className="vendor-auth-form__footer">
                  Already a vendor?{" "}
                  <button type="button" onClick={() => switchMode("login")}
                    className="vendor-auth-form__switch-btn">
                    Sign in here
                  </button>
                </p>
              </form>
            )}

            {/* Customer link */}
            <div className="vendor-auth-customer-link">
              <div className="vendor-auth-divider" />
              <p className="vendor-auth-customer-link__label">Looking to shop instead?</p>
              <Link to="/login" className="vendor-auth-customer-link__cta">
                Customer Login <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
