import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, register, clearError, logout } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import { FiShoppingBag, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import "./AuthPage.css";

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo, loading, error } = useSelector((state) => state.auth);

  const defaultMode = location.pathname === "/register" ? "register" : "login";
  const [authMode, setAuthMode] = useState(defaultMode);
  const [formError, setFormError] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "", email: "", password: "", role: "customer",
  });
  const didRegister = useRef(false);

  useEffect(() => {
    if (!userInfo) return;

    if (userInfo.role === "customer") {
      // Correct portal — proceed
      navigate("/", { replace: true });
    } else if (userInfo.role === "vendor") {
      // Wrong portal — block and show error
      dispatch(logout());
      setFormError("This account is registered as a Vendor. Please sign in at the Vendor Portal.");
      toast.error("Wrong portal — use the Vendor Portal.");
    } else if (userInfo.role === "superadmin") {
      dispatch(logout());
      setFormError("Admin accounts cannot sign in here.");
      toast.error("Admin accounts cannot use this portal.");
    }
  }, [userInfo]);

  // Show inline error on failed login/register
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
    didRegister.current = true;
    dispatch(register(registerData));
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setFormError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-wrap">

        {/* Branding */}
        <div className="auth-brand">
          <Link to="/" className="auth-brand-link">
            <FiShoppingBag size={24} /> Tradezy
          </Link>
          <h1 className="auth-title">
            {authMode === "login" ? "Welcome Back!" : "Create Account"}
          </h1>
          <p className="auth-subtitle">
            {authMode === "login"
              ? "Sign in to continue shopping"
              : "Join Tradezy and start shopping today"}
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-accent" />

          <div className="auth-card-body">
            {/* Toggle */}
            <div className="auth-toggle">
              <button
                onClick={() => switchMode("login")}
                className={`auth-toggle-btn ${authMode === "login" ? "auth-toggle-btn--active" : ""}`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode("register")}
                className={`auth-toggle-btn ${authMode === "register" ? "auth-toggle-btn--active" : ""}`}
              >
                Register
              </button>
            </div>

            {/* Inline error banner */}
            {formError && (
              <div className="auth-error-banner">
                <FiAlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="auth-form__field">
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email" name="email"
                    value={loginData.email} onChange={handleLoginChange}
                    required placeholder="you@example.com"
                    className="form-input"
                  />
                </div>
                <div className="auth-form__field">
                  <label className="form-label">
                    Password
                  </label>
                  <input
                    type="password" name="password"
                    value={loginData.password} onChange={handleLoginChange}
                    required placeholder="••••••••"
                    className="form-input"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="auth-form__btn"
                >
                  {loading && <Spinner size="sm" />}
                  {loading ? "Signing in…" : "Sign In"}
                </button>
                <p className="auth-form__footer">
                  No account?{" "}
                  <button type="button" onClick={() => switchMode("register")}
                    className="auth-form__switch-btn">
                    Register here
                  </button>
                </p>
              </form>
            ) : (
              /* ── REGISTER FORM ── */
              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div className="auth-form__field">
                  <label className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text" name="name"
                    value={registerData.name} onChange={handleRegisterChange}
                    required placeholder="Your Name"
                    className="form-input"
                  />
                </div>
                <div className="auth-form__field">
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email" name="email"
                    value={registerData.email} onChange={handleRegisterChange}
                    required placeholder="you@example.com"
                    className="form-input"
                  />
                </div>
                <div className="auth-form__field">
                  <label className="form-label">
                    Password
                  </label>
                  <input
                    type="password" name="password"
                    value={registerData.password} onChange={handleRegisterChange}
                    required placeholder="Min. 6 characters"
                    className="form-input"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="auth-form__btn"
                >
                  {loading && <Spinner size="sm" />}
                  {loading ? "Creating account…" : "Create Account"}
                </button>
                <p className="auth-form__footer">
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("login")}
                    className="auth-form__switch-btn">
                    Sign in here
                  </button>
                </p>
              </form>
            )}

            {/* Vendor portal link */}
            <div className="auth-vendor-link">
              <p className="auth-vendor-link__label">Selling on Tradezy?</p>
              <Link to="/vendor/login" className="auth-vendor-link__cta">
                Go to Vendor Portal <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
