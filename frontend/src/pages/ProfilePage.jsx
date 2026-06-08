import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile, updatePassword, logout, fetchAddresses, addAddress, updateAddress, deleteAddress } from "../features/auth/authSlice";
import { fetchMyOrders } from "../features/order/orderSlice";
import Spinner from "../components/common/Spinner";
import toast from "react-hot-toast";
import {
  FiUser, FiMail, FiPhone, FiLock, FiShoppingBag, FiHeart,
  FiLogOut, FiEdit2, FiCheck, FiAlertCircle, FiCalendar,
  FiGrid, FiPackage, FiMapPin, FiPlus, FiTrash2, FiStar,
} from "react-icons/fi";
import "./ProfilePage.css";

const SECTIONS = {
  INFO:      "info",
  PASSWORD:  "password",
  ORDERS:    "orders",
  ADDRESSES: "addresses",
};

const BLANK_ADDR = { label: "Home", fullName: "", email: "", phone: "", street: "", city: "", state: "", postalCode: "", country: "India", isDefault: false };

export default function ProfilePage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { userInfo, loading, addresses } = useSelector((s) => s.auth);
  const { myOrders } = useSelector((s) => s.order);

  const [activeSection, setActiveSection] = useState(SECTIONS.INFO);
  const [editingInfo, setEditingInfo] = useState(false);

  const [infoForm, setInfoForm] = useState({ name: "", phone: "" });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError]   = useState("");

  // Address state
  const [addrForm, setAddrForm] = useState(BLANK_ADDR);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);

  const isVendor   = userInfo?.role === "vendor";
  const isAdmin    = userInfo?.role === "superadmin";
  const isCustomer = userInfo?.role === "customer";
  const avatarRole = isVendor ? "vendor" : isAdmin ? "admin" : "customer";

  const roleLabel = isAdmin ? "Admin" : isVendor ? "Vendor" : "Customer";

  useEffect(() => {
    if (!userInfo) { navigate("/login"); return; }
    setInfoForm({ name: userInfo.name || "", phone: userInfo.phone || "" });
    if (isCustomer) { dispatch(fetchMyOrders()); dispatch(fetchAddresses()); }
  }, [userInfo]);

  const handleInfoSave = async (e) => {
    e.preventDefault();
    if (!infoForm.name.trim()) { toast.error("Name cannot be empty"); return; }
    const result = await dispatch(updateProfile(infoForm));
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Profile updated!");
      setEditingInfo(false);
    } else {
      toast.error(result.payload || "Update failed");
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }
    const result = await dispatch(updatePassword({
      currentPassword: passForm.currentPassword,
      newPassword: passForm.newPassword,
    }));
    if (updatePassword.fulfilled.match(result)) {
      setPassSuccess("Password changed successfully!");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPassError(result.payload || "Failed to change password");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    toast.success("Logged out.");
  };

  const openAddAddr = () => { setAddrForm(BLANK_ADDR); setEditingAddrId(null); setShowAddrForm(true); };
  const openEditAddr = (addr) => { setAddrForm({ ...addr }); setEditingAddrId(addr._id); setShowAddrForm(true); };
  const cancelAddrForm = () => { setShowAddrForm(false); setEditingAddrId(null); };

  const handleAddrSave = async (e) => {
    e.preventDefault();
    setAddrLoading(true);
    let result;
    if (editingAddrId) {
      result = await dispatch(updateAddress({ addrId: editingAddrId, formData: addrForm }));
    } else {
      result = await dispatch(addAddress(addrForm));
    }
    setAddrLoading(false);
    if (addAddress.fulfilled.match(result) || updateAddress.fulfilled.match(result)) {
      toast.success(editingAddrId ? "Address updated!" : "Address added!");
      setShowAddrForm(false);
      setEditingAddrId(null);
    } else {
      toast.error(result.payload || "Failed to save address");
    }
  };

  const handleAddrDelete = async (addrId) => {
    const result = await dispatch(deleteAddress(addrId));
    if (deleteAddress.fulfilled.match(result)) toast.success("Address removed.");
  };

  if (!userInfo) return null;

  const joinedDate = userInfo.createdAt
    ? new Date(userInfo.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  const orderStats = {
    total:     myOrders.length,
    active:    myOrders.filter((o) => ["pending","confirmed","shipped"].includes(o.status)).length,
    delivered: myOrders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* ── Sidebar ── */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar__card">
            {/* Identity block */}
            <div className="profile-sidebar__identity">
              <div className={`profile-sidebar__avatar navbar-avatar--${avatarRole}`}>
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="profile-sidebar__name">{userInfo.name}</p>
                <p className="profile-sidebar__email">{userInfo.email}</p>
                <span className="profile-sidebar__role-badge">{roleLabel}</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="profile-sidebar__nav">
              <p className="profile-sidebar__nav-section">Account</p>

              <button
                className={`profile-sidebar__nav-btn ${activeSection === SECTIONS.INFO ? "profile-sidebar__nav-btn--active" : ""}`}
                onClick={() => setActiveSection(SECTIONS.INFO)}
              >
                <FiUser size={15} /> Personal Information
              </button>

              <button
                className={`profile-sidebar__nav-btn ${activeSection === SECTIONS.PASSWORD ? "profile-sidebar__nav-btn--active" : ""}`}
                onClick={() => setActiveSection(SECTIONS.PASSWORD)}
              >
                <FiLock size={15} /> Change Password
              </button>

              {isCustomer && (
                <>
                  <p className="profile-sidebar__nav-section">Shopping</p>
                  <button
                    className={`profile-sidebar__nav-btn ${activeSection === SECTIONS.ORDERS ? "profile-sidebar__nav-btn--active" : ""}`}
                    onClick={() => setActiveSection(SECTIONS.ORDERS)}
                  >
                    <FiPackage size={15} /> My Orders
                  </button>
                  <button
                    className={`profile-sidebar__nav-btn ${activeSection === SECTIONS.ADDRESSES ? "profile-sidebar__nav-btn--active" : ""}`}
                    onClick={() => setActiveSection(SECTIONS.ADDRESSES)}
                  >
                    <FiMapPin size={15} /> Saved Addresses
                  </button>
                  <Link to="/wishlist" className="profile-sidebar__nav-btn">
                    <FiHeart size={15} /> My Wishlist
                  </Link>
                </>
              )}

              {isVendor && (
                <>
                  <p className="profile-sidebar__nav-section">Seller</p>
                  <Link to="/vendor/dashboard" className="profile-sidebar__nav-btn">
                    <FiGrid size={15} /> Vendor Dashboard
                  </Link>
                  <Link to="/vendor/store" className="profile-sidebar__nav-btn">
                    <FiShoppingBag size={15} /> My Store
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <p className="profile-sidebar__nav-section">Admin</p>
                  <Link to="/admin/dashboard" className="profile-sidebar__nav-btn">
                    <FiGrid size={15} /> Admin Dashboard
                  </Link>
                </>
              )}

              <p className="profile-sidebar__nav-section">Session</p>
              <button
                className="profile-sidebar__nav-btn profile-sidebar__nav-btn--danger"
                onClick={handleLogout}
              >
                <FiLogOut size={15} /> Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="profile-main">

          {/* ── PERSONAL INFO ── */}
          {activeSection === SECTIONS.INFO && (
            <>
              {/* Stats row — customers only */}
              {isCustomer && (
                <div className="profile-section">
                  <div className="profile-stats-row">
                    <div className="profile-stat">
                      <p className="profile-stat__value">{orderStats.total}</p>
                      <p className="profile-stat__label">Total Orders</p>
                    </div>
                    <div className="profile-stat">
                      <p className="profile-stat__value">{orderStats.active}</p>
                      <p className="profile-stat__label">Active</p>
                    </div>
                    <div className="profile-stat">
                      <p className="profile-stat__value">{orderStats.delivered}</p>
                      <p className="profile-stat__label">Delivered</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal info card */}
              <div className="profile-section">
                <div className="profile-section__header">
                  <h2 className="profile-section__title">
                    <FiUser className="profile-section__title-icon" size={16} />
                    Personal Information
                  </h2>
                  {!editingInfo && (
                    <button className="profile-section__edit-btn" onClick={() => setEditingInfo(true)}>
                      <FiEdit2 size={13} /> Edit
                    </button>
                  )}
                </div>

                <div className="profile-section__body">
                  {editingInfo ? (
                    <form className="profile-form" onSubmit={handleInfoSave}>
                      <div className="profile-form-grid">
                        <div>
                          <label className="form-label">Full Name</label>
                          <input
                            className="form-input"
                            value={infoForm.name}
                            onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                            required
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className="form-label">Phone Number</label>
                          <input
                            className="form-input"
                            value={infoForm.phone}
                            onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                            placeholder="Phone number"
                            type="tel"
                          />
                        </div>
                      </div>
                      <div className="profile-form__actions">
                        <button type="submit" className="profile-form__save-btn" disabled={loading}>
                          {loading ? <Spinner size="sm" /> : <FiCheck size={14} />}
                          Save Changes
                        </button>
                        <button type="button" className="profile-form__cancel-btn" onClick={() => {
                          setEditingInfo(false);
                          setInfoForm({ name: userInfo.name || "", phone: userInfo.phone || "" });
                        }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-info-grid">
                      <div>
                        <p className="profile-info-item__label">
                          <FiUser size={11} style={{ display:"inline", marginRight: 4 }} />
                          Full Name
                        </p>
                        <p className="profile-info-item__value">{userInfo.name}</p>
                      </div>
                      <div>
                        <p className="profile-info-item__label">
                          <FiMail size={11} style={{ display:"inline", marginRight: 4 }} />
                          Email Address
                        </p>
                        <p className="profile-info-item__value">{userInfo.email}</p>
                      </div>
                      <div>
                        <p className="profile-info-item__label">
                          <FiPhone size={11} style={{ display:"inline", marginRight: 4 }} />
                          Phone Number
                        </p>
                        <p className={`profile-info-item__value${!userInfo.phone ? " profile-info-item__value--muted" : ""}`}>
                          {userInfo.phone || "Not added yet"}
                        </p>
                      </div>
                      <div>
                        <p className="profile-info-item__label">Account Type</p>
                        <p className="profile-info-item__value">{roleLabel}</p>
                      </div>
                      {joinedDate && (
                        <div>
                          <p className="profile-info-item__label">
                            <FiCalendar size={11} style={{ display:"inline", marginRight: 4 }} />
                            Member Since
                          </p>
                          <p className="profile-info-item__value">{joinedDate}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── CHANGE PASSWORD ── */}
          {activeSection === SECTIONS.PASSWORD && (
            <div className="profile-section">
              <div className="profile-section__header">
                <h2 className="profile-section__title">
                  <FiLock className="profile-section__title-icon" size={16} />
                  Change Password
                </h2>
              </div>
              <div className="profile-section__body">
                {passSuccess && (
                  <div className="profile-password-success">
                    <FiCheck size={16} /> {passSuccess}
                  </div>
                )}
                {passError && (
                  <div className="profile-password-error">
                    <FiAlertCircle size={16} /> {passError}
                  </div>
                )}
                <form className="profile-password-form" onSubmit={handlePasswordSave} style={{ marginTop: passSuccess || passError ? "1rem" : 0 }}>
                  <div>
                    <label className="form-label">Current Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={passForm.currentPassword}
                      onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                      required
                      placeholder="Current password"
                    />
                  </div>
                  <div>
                    <label className="form-label">New Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      placeholder="New password"
                    />
                  </div>
                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                      required
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="profile-form__actions">
                    <button type="submit" className="profile-form__save-btn" disabled={loading}>
                      {loading ? <Spinner size="sm" /> : <FiLock size={14} />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── MY ORDERS (customer only) ── */}
          {activeSection === SECTIONS.ORDERS && isCustomer && (
            <div className="profile-section">
              <div className="profile-section__header">
                <h2 className="profile-section__title">
                  <FiPackage className="profile-section__title-icon" size={16} />
                  My Orders
                </h2>
                <Link to="/my-orders" className="profile-section__edit-btn">
                  View All
                </Link>
              </div>
              <div className="profile-section__body">
                {myOrders.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"3rem 1rem", color:"var(--clr-text-400)" }}>
                    <FiShoppingBag size={40} style={{ marginBottom:"0.75rem" }} />
                    <p>No orders yet.</p>
                    <Link to="/" className="profile-form__save-btn" style={{ display:"inline-flex", marginTop:"1rem", textDecoration:"none" }}>
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                    {myOrders.slice(0, 5).map((order) => (
                      <Link
                        key={order._id}
                        to={`/order-confirmation/${order._id}`}
                        style={{ textDecoration:"none" }}
                      >
                        <div style={{
                          display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"0.875rem 1rem",
                          border:"1px solid var(--clr-border-light)",
                          borderRadius:"var(--radius-md)",
                          transition:"background 0.1s",
                          background:"var(--clr-bg-subtle)"
                        }}>
                          <div>
                            <p style={{ fontFamily:"monospace", fontSize:"0.75rem", color:"var(--clr-text-400)", marginBottom:"0.2rem" }}>
                              #{order._id.slice(-8).toUpperCase()}
                            </p>
                            <p style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--clr-text-800)" }}>
                              {order.store?.name || "—"}
                            </p>
                            <p style={{ fontSize:"0.75rem", color:"var(--clr-text-500)" }}>
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                            </p>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <span className={`badge badge--${order.status}`} style={{ marginBottom:"0.25rem", display:"inline-block" }}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <p style={{ fontSize:"0.9375rem", fontWeight:700, color:"var(--clr-text-900)" }}>
                              ₹{order.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {myOrders.length > 5 && (
                      <Link to="/my-orders" style={{ textAlign:"center", fontSize:"0.875rem", color:"var(--clr-primary)", textDecoration:"none", padding:"0.5rem" }}>
                        View all {myOrders.length} orders →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SAVED ADDRESSES (customer only) ── */}
          {activeSection === SECTIONS.ADDRESSES && isCustomer && (
            <div className="profile-section">
              <div className="profile-section__header">
                <h2 className="profile-section__title">
                  <FiMapPin className="profile-section__title-icon" size={16} />
                  Saved Addresses
                </h2>
                {!showAddrForm && (
                  <button className="profile-section__edit-btn" onClick={openAddAddr}>
                    <FiPlus size={13} /> Add New
                  </button>
                )}
              </div>

              <div className="profile-section__body">

                {/* Add / Edit form */}
                {showAddrForm && (
                  <form className="addr-form" onSubmit={handleAddrSave}>
                    <h3 className="addr-form__title">{editingAddrId ? "Edit Address" : "New Address"}</h3>
                    <div className="addr-form__grid">
                      <div className="addr-form__field addr-form__field--full">
                        <label className="form-label">Label</label>
                        <select className="form-select" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}>
                          {["Home", "Work", "Other"].map((l) => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="addr-form__field addr-form__field--full">
                        <label className="form-label">Full Name <span style={{ color: "var(--clr-red)" }}>*</span></label>
                        <input className="form-input" value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} required placeholder="Full name" />
                      </div>
                      <div className="addr-form__field">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={addrForm.email} onChange={(e) => setAddrForm({ ...addrForm, email: e.target.value })} placeholder="Email address" />
                      </div>
                      <div className="addr-form__field">
                        <label className="form-label">Phone</label>
                        <input className="form-input" type="tel" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="Phone number" />
                      </div>
                      <div className="addr-form__field addr-form__field--full">
                        <label className="form-label">Street Address <span style={{ color: "var(--clr-red)" }}>*</span></label>
                        <input className="form-input" value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} required placeholder="Street address" />
                      </div>
                      <div className="addr-form__field">
                        <label className="form-label">City <span style={{ color: "var(--clr-red)" }}>*</span></label>
                        <input className="form-input" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} required placeholder="City" />
                      </div>
                      <div className="addr-form__field">
                        <label className="form-label">State <span style={{ color: "var(--clr-red)" }}>*</span></label>
                        <input className="form-input" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} required placeholder="State" />
                      </div>
                      <div className="addr-form__field">
                        <label className="form-label">Postal Code <span style={{ color: "var(--clr-red)" }}>*</span></label>
                        <input className="form-input" value={addrForm.postalCode} onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })} required placeholder="PIN code" />
                      </div>
                      <div className="addr-form__field">
                        <label className="form-label">Country</label>
                        <input className="form-input" value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} placeholder="Country" />
                      </div>
                    </div>
                    <label className="addr-form__default-check">
                      <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                      Set as default address
                    </label>
                    <div className="profile-form__actions" style={{ marginTop: "1rem" }}>
                      <button type="submit" className="profile-form__save-btn" disabled={addrLoading}>
                        {addrLoading ? <Spinner size="sm" /> : <FiCheck size={14} />}
                        {editingAddrId ? "Update Address" : "Save Address"}
                      </button>
                      <button type="button" className="profile-form__cancel-btn" onClick={cancelAddrForm}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Address cards */}
                {!showAddrForm && (
                  addresses.length === 0 ? (
                    <div className="addr-empty">
                      <FiMapPin size={36} className="addr-empty__icon" />
                      <p className="addr-empty__title">No saved addresses yet</p>
                      <p className="addr-empty__desc">Add an address to speed up checkout.</p>
                      <button className="profile-form__save-btn" onClick={openAddAddr} style={{ marginTop: "1rem", display: "inline-flex" }}>
                        <FiPlus size={14} /> Add Address
                      </button>
                    </div>
                  ) : (
                    <div className="addr-list">
                      {addresses.map((addr) => (
                        <div key={addr._id} className={`addr-card${addr.isDefault ? " addr-card--default" : ""}`}>
                          <div className="addr-card__header">
                            <span className="addr-card__label">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="addr-card__default-badge">
                                <FiStar size={10} /> Default
                              </span>
                            )}
                          </div>
                          <p className="addr-card__name">{addr.fullName}</p>
                          <p className="addr-card__line">{addr.street}</p>
                          <p className="addr-card__line">{addr.city}, {addr.state} — {addr.postalCode}</p>
                          {addr.phone && <p className="addr-card__line">{addr.phone}</p>}
                          <div className="addr-card__actions">
                            <button className="addr-card__btn addr-card__btn--edit" onClick={() => openEditAddr(addr)}>
                              <FiEdit2 size={12} /> Edit
                            </button>
                            <button className="addr-card__btn addr-card__btn--del" onClick={() => handleAddrDelete(addr._id)}>
                              <FiTrash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
