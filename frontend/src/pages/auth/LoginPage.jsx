import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { login, clearError } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import "./LoginPage.css";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (userInfo) {
      toast.success(`Welcome back, ${userInfo.name}!`);
      redirectByRole(userInfo.role);
    }
  }, [userInfo]);

  useEffect(() => {
    if (error) {
      setFormError(error);
      toast.error(error);
      dispatch(clearError());
    }
  }, [error]);

  const redirectByRole = (role) => {
    if (role === "superadmin") navigate("/admin/dashboard");
    else if (role === "vendor") navigate("/vendor/dashboard");
    else navigate("/");
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    dispatch(login(formData));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {formError && (
            <div className="login-error-banner">
              <span className="login-error-banner__icon">!</span>
              <span>{formError}</span>
            </div>
          )}
          <div className="login-field">
            <label className="form-label">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="form-input"
            />
          </div>

          <div className="login-field">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-submit"
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          Don&apos;t have an account?{" "}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
