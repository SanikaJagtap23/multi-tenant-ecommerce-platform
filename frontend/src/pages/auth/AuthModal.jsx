import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, register, openAuthModal, closeAuthModal } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import {
  FiX, FiShoppingBag, FiBriefcase,
  FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowRight,
} from "react-icons/fi";
import "./AuthModal.css";

export default function AuthModal() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { authModalOpen, authModalTab, loading } = useSelector((s) => s.auth);

  const [mode,     setMode]     = useState("signin");
  const [showPass, setShowPass] = useState(false);
  const [form,     setForm]     = useState({ name: "", email: "", password: "" });
  const emailRef = useRef(null);

  const isVendor = authModalTab === "vendor";

  // Reset whenever modal opens
  useEffect(() => {
    if (authModalOpen) {
      setMode("signin");
      setForm({ name: "", email: "", password: "" });
      setShowPass(false);
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [authModalOpen, authModalTab]);

  // Escape to close
  useEffect(() => {
    if (!authModalOpen) return;
    const handle = (e) => { if (e.key === "Escape") dispatch(closeAuthModal()); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [authModalOpen, dispatch]);

  if (!authModalOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "signin") {
      const result = await dispatch(login({ email: form.email, password: form.password }));
      if (login.fulfilled.match(result)) {
        const { name, role } = result.payload;
        toast.success(`Welcome back, ${name}!`);
        dispatch(closeAuthModal());
        if (role === "vendor")      navigate("/vendor/dashboard");
        else if (role === "superadmin") navigate("/admin/dashboard");
      } else {
        toast.error(result.payload || "Invalid email or password");
      }
    } else {
      const result = await dispatch(register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: isVendor ? "vendor" : "customer",
      }));
      if (register.fulfilled.match(result)) {
        const { name, role } = result.payload;
        toast.success(`Welcome to Tradezy, ${name}!`);
        dispatch(closeAuthModal());
        if (role === "vendor") navigate("/vendor/dashboard");
      } else {
        toast.error(result.payload || "Registration failed");
      }
    }
  };

  /* ── VENDOR MODAL ──────────────────────────────────── */
  if (isVendor) {
    return (
      <div className="am-backdrop" onClick={() => dispatch(closeAuthModal())}>
        <div className="am-card am-card--vendor" onClick={(e) => e.stopPropagation()}>
          <button className="am-close am-close--vendor" onClick={() => dispatch(closeAuthModal())}>
            <FiX size={18} />
          </button>

          <div className="am-header am-header--vendor">
            <div className="am-logo am-logo--vendor">
              <FiBriefcase size={22} />
            </div>
            <h2 className="am-title">
              {mode === "signin" ? "Vendor Portal" : "Join as Vendor"}
            </h2>
            <p className="am-subtitle">
              {mode === "signin"
                ? "Access your store and manage products"
                : "Start selling on Tradezy — completely free"}
            </p>
          </div>

          <div className="am-mode-tabs am-mode-tabs--vendor">
            <button className={`am-mode-tab am-mode-tab--vendor${mode === "signin"   ? " am-mode-tab--active-v" : ""}`} onClick={() => setMode("signin")}    type="button">Sign In</button>
            <button className={`am-mode-tab am-mode-tab--vendor${mode === "register" ? " am-mode-tab--active-v" : ""}`} onClick={() => setMode("register")} type="button">Register</button>
          </div>

          <form className="am-form am-form--vendor" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="am-field">
                <label className="am-label--vendor">Full Name</label>
                <div className="am-input-wrap am-input-wrap--vendor">
                  <FiUser className="am-input-icon" size={15} />
                  <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Full name" autoComplete="name" />
                </div>
              </div>
            )}
            <div className="am-field">
              <label className="am-label--vendor">Email</label>
              <div className="am-input-wrap am-input-wrap--vendor">
                <FiMail className="am-input-icon" size={15} />
                <input ref={emailRef} type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email address" autoComplete="email" />
              </div>
            </div>
            <div className="am-field">
              <label className="am-label--vendor">Password</label>
              <div className="am-input-wrap am-input-wrap--vendor">
                <FiLock className="am-input-icon" size={15} />
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                <button type="button" className="am-pass-toggle am-pass-toggle--vendor" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="am-submit am-submit--vendor" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign In to Vendor Portal" : "Create Vendor Account"}
            </button>
          </form>

          <p className="am-info am-info--vendor">
            Looking to shop instead?{" "}
            <button type="button" onClick={() => dispatch(openAuthModal("customer"))}>
              Customer Login <FiArrowRight size={11} />
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ── CUSTOMER MODAL ────────────────────────────────── */
  return (
    <div className="am-backdrop" onClick={() => dispatch(closeAuthModal())}>
      <div className="am-card" onClick={(e) => e.stopPropagation()}>
        <button className="am-close" onClick={() => dispatch(closeAuthModal())}>
          <FiX size={18} />
        </button>

        <div className="am-header">
          <div className="am-logo">
            <FiShoppingBag size={22} />
          </div>
          <h2 className="am-title">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p className="am-subtitle">
            {mode === "signin" ? "Shop smarter, save bigger" : "Join thousands of happy shoppers"}
          </p>
        </div>

        <div className="am-mode-tabs">
          <button className={`am-mode-tab${mode === "signin"   ? " am-mode-tab--active" : ""}`} onClick={() => setMode("signin")}    type="button">Sign In</button>
          <button className={`am-mode-tab${mode === "register" ? " am-mode-tab--active" : ""}`} onClick={() => setMode("register")} type="button">Register</button>
        </div>

        <form className="am-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="am-field">
              <label>Full Name</label>
              <div className="am-input-wrap">
                <FiUser className="am-input-icon" size={15} />
                <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Full name" autoComplete="name" />
              </div>
            </div>
          )}
          <div className="am-field">
            <label>Email</label>
            <div className="am-input-wrap">
              <FiMail className="am-input-icon" size={15} />
              <input ref={emailRef} type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email address" autoComplete="email" />
            </div>
          </div>
          <div className="am-field">
            <label>Password</label>
            <div className="am-input-wrap">
              <FiLock className="am-input-icon" size={15} />
              <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
              <button type="button" className="am-pass-toggle" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" className="am-submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="am-info">
          Selling on Tradezy?{" "}
          <button type="button" onClick={() => dispatch(openAuthModal("vendor"))}>
            Go to Vendor Portal <FiArrowRight size={11} />
          </button>
        </p>
      </div>
    </div>
  );
}
