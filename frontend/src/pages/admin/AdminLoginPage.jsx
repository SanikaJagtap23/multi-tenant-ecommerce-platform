import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../features/auth/authSlice";
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiAlertCircle } from "react-icons/fi";
import "./AdminLoginPage.css";

export default function AdminLoginPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    const result = await dispatch(login({ email: form.email, password: form.password }));

    if (login.fulfilled.match(result)) {
      const user = result.payload;
      if (user.role !== "superadmin") {
        // Log them back out — wrong role
        dispatch({ type: "auth/logout" });
        localStorage.removeItem("userInfo");
        setError("Access denied. Admin credentials required.");
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError(result.payload || "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="adlogin-root">
      {/* Background blobs */}
      <div className="adlogin-blob adlogin-blob--1" />
      <div className="adlogin-blob adlogin-blob--2" />

      <div className="adlogin-card">
        {/* Brand */}
        <div className="adlogin-brand">
          <div className="adlogin-shield">
            <FiShield size={28} />
          </div>
          <h1 className="adlogin-title">Admin Portal</h1>
          <p className="adlogin-subtitle">Secure access — authorised personnel only</p>
        </div>

        {/* Error */}
        {error && (
          <div className="adlogin-error">
            <FiAlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="adlogin-form" noValidate>
          <div className="adlogin-field">
            <label className="adlogin-label">Email address</label>
            <div className="adlogin-input-wrap">
              <FiMail className="adlogin-input-icon" size={16} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className="adlogin-input"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="adlogin-field">
            <label className="adlogin-label">Password</label>
            <div className="adlogin-input-wrap">
              <FiLock className="adlogin-input-icon" size={16} />
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="adlogin-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="adlogin-toggle-pwd"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
              >
                {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="adlogin-btn" disabled={loading}>
            {loading ? (
              <span className="adlogin-btn-spinner" />
            ) : (
              "Sign in to Admin Panel"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="adlogin-footer">
          <Link to="/" className="adlogin-back-link">
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
