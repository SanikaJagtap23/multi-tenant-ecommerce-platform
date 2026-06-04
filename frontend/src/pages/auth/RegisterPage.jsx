import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register, clearError } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import "./RegisterPage.css";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const didRegister = useRef(false);

  useEffect(() => {
    if (userInfo && didRegister.current) {
      toast.success("Account created successfully! Welcome!");
      if (userInfo.role === "vendor") navigate("/vendor/dashboard");
      else navigate("/");
    } else if (userInfo) {
      // Already logged in — just redirect silently
      if (userInfo.role === "vendor") navigate("/vendor/dashboard");
      else navigate("/");
    }
  }, [userInfo]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    didRegister.current = true;
    dispatch(register(formData));
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join our platform today</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-field">
            <label className="form-label">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="form-input"
            />
          </div>

          <div className="register-field">
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

          <div className="register-field">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min. 6 characters"
              className="form-input"
            />
          </div>

          <div className="register-field">
            <label className="form-label">
              Register As
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-submit"
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
