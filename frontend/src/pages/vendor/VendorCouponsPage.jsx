import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendorCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon,
} from "../../features/coupon/couponSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import {
  FiTag, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight,
  FiX, FiAlertCircle,
} from "react-icons/fi";
import "./VendorCouponsPage.css";

const EMPTY_FORM = {
  code:           "",
  type:           "flat",
  discountValue:  "",
  minOrderAmount: "",
  maxDiscount:    "",
  expiryDate:     "",
  usageLimit:     "",
};

const fmt = (n) => (n != null ? `₹${Number(n).toLocaleString()}` : "—");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const isExpired = (d) => new Date(d) < new Date();

export default function VendorCouponsPage() {
  const dispatch = useDispatch();
  const { coupons, loading, error } = useSelector((s) => s.coupon);

  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [submitting,setSubmitting]= useState(false);
  const [deleteId,  setDeleteId]  = useState(null);

  useEffect(() => { dispatch(fetchVendorCoupons()); }, [dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Coupon code is required.");
    if (!form.discountValue || Number(form.discountValue) < 1)
      return toast.error("Discount value must be at least 1.");
    if (!form.expiryDate) return toast.error("Expiry date is required.");
    if (new Date(form.expiryDate) <= new Date())
      return toast.error("Expiry date must be in the future.");
    if (form.type === "percent" && Number(form.discountValue) > 100)
      return toast.error("Percent discount cannot exceed 100.");

    setSubmitting(true);
    const payload = {
      code:           form.code.toUpperCase().trim(),
      type:           form.type,
      discountValue:  Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      maxDiscount:    form.maxDiscount    ? Number(form.maxDiscount)    : null,
      expiryDate:     form.expiryDate,
      usageLimit:     form.usageLimit     ? Number(form.usageLimit)     : null,
    };

    const result = await dispatch(createCoupon(payload));
    setSubmitting(false);

    if (createCoupon.fulfilled.match(result)) {
      toast.success(`Coupon "${payload.code}" created!`);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } else {
      toast.error(result.payload || "Failed to create coupon.");
    }
  };

  const handleDelete = async (id) => {
    const result = await dispatch(deleteCoupon(id));
    if (deleteCoupon.fulfilled.match(result)) toast.success("Coupon deleted.");
    else toast.error(result.payload || "Failed.");
    setDeleteId(null);
  };

  const handleToggle = async (id) => {
    const result = await dispatch(toggleCoupon(id));
    if (!toggleCoupon.fulfilled.match(result)) toast.error(result.payload || "Failed.");
  };

  const minDateStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return (
    <div className="vcoupons">
      <div className="vcoupons__header">
        <div>
          <h1 className="vcoupons__title">Coupons</h1>
          <p className="vcoupons__subtitle">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} created</p>
        </div>
        <button className="vcoupons__add-btn" onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}>
          <FiPlus size={16} /> Create Coupon
        </button>
      </div>

      {error && (
        <div className="vcoupons__error">
          <FiAlertCircle size={14} /> {error}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="vcoupons__modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="vcoupons__modal" onClick={(e) => e.stopPropagation()}>
            <div className="vcoupons__modal-header">
              <h2 className="vcoupons__modal-title"><FiTag size={18} /> New Coupon</h2>
              <button className="vcoupons__modal-close" onClick={() => setShowForm(false)}>
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="vcoupons__form">
              <div className="vcoupons__form-row">
                <div className="vcoupons__field">
                  <label>Coupon Code <span>*</span></label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="e.g. SAVE20"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div className="vcoupons__field">
                  <label>Discount Type <span>*</span></label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="flat">Flat (₹ off)</option>
                    <option value="percent">Percent (% off)</option>
                  </select>
                </div>
              </div>

              <div className="vcoupons__form-row">
                <div className="vcoupons__field">
                  <label>
                    {form.type === "flat" ? "Discount Amount (₹)" : "Discount (%)"} <span>*</span>
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={form.discountValue}
                    onChange={handleChange}
                    placeholder={form.type === "flat" ? "e.g. 100" : "e.g. 10"}
                    min="1"
                    max={form.type === "percent" ? "100" : undefined}
                  />
                </div>
                <div className="vcoupons__field">
                  <label>Min. Order Amount (₹)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                    placeholder="e.g. 500 (optional)"
                    min="0"
                  />
                </div>
              </div>

              {form.type === "percent" && (
                <div className="vcoupons__form-row">
                  <div className="vcoupons__field">
                    <label>Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      name="maxDiscount"
                      value={form.maxDiscount}
                      onChange={handleChange}
                      placeholder="e.g. 200 (optional)"
                      min="1"
                    />
                  </div>
                  <div className="vcoupons__field" />
                </div>
              )}

              <div className="vcoupons__form-row">
                <div className="vcoupons__field">
                  <label>Expiry Date <span>*</span></label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    min={minDateStr}
                  />
                </div>
                <div className="vcoupons__field">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleChange}
                    placeholder="Unlimited (optional)"
                    min="1"
                  />
                </div>
              </div>

              <div className="vcoupons__modal-actions">
                <button type="button" className="vcoupons__cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="vcoupons__submit-btn" disabled={submitting}>
                  {submitting ? <><Spinner size="sm" /> Creating…</> : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon List */}
      {loading ? (
        <div className="vcoupons__spinner"><Spinner /></div>
      ) : coupons.length === 0 ? (
        <div className="vcoupons__empty">
          <FiTag size={40} />
          <p>No coupons yet</p>
          <span>Create your first coupon to offer discounts to customers.</span>
        </div>
      ) : (
        <div className="vcoupons__grid">
          {coupons.map((c) => {
            const expired = isExpired(c.expiryDate);
            const exhausted = c.usageLimit !== null && c.usedCount >= c.usageLimit;
            const statusTag = !c.isActive
              ? { label: "Inactive", cls: "vcoupons__tag--inactive" }
              : expired
              ? { label: "Expired",  cls: "vcoupons__tag--expired" }
              : exhausted
              ? { label: "Exhausted",cls: "vcoupons__tag--exhausted" }
              : { label: "Active",   cls: "vcoupons__tag--active" };

            return (
              <div key={c._id} className={`vcoupons__card${!c.isActive || expired || exhausted ? " vcoupons__card--dim" : ""}`}>
                <div className="vcoupons__card-top">
                  <div className="vcoupons__card-left">
                    <span className="vcoupons__code">{c.code}</span>
                    <span className={`vcoupons__tag ${statusTag.cls}`}>{statusTag.label}</span>
                  </div>
                  <div className="vcoupons__card-actions">
                    <button
                      className={`vcoupons__toggle ${c.isActive ? "vcoupons__toggle--on" : "vcoupons__toggle--off"}`}
                      onClick={() => handleToggle(c._id)}
                      title={c.isActive ? "Deactivate" : "Activate"}
                    >
                      {c.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                    </button>
                    <button
                      className="vcoupons__delete"
                      onClick={() => setDeleteId(c._id)}
                      title="Delete coupon"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="vcoupons__discount">
                  {c.type === "flat"
                    ? `₹${c.discountValue} off`
                    : `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}`
                  }
                </div>

                <div className="vcoupons__meta">
                  <div className="vcoupons__meta-row">
                    <span className="vcoupons__meta-label">Min. order</span>
                    <span>{c.minOrderAmount > 0 ? fmt(c.minOrderAmount) : "None"}</span>
                  </div>
                  <div className="vcoupons__meta-row">
                    <span className="vcoupons__meta-label">Expires</span>
                    <span className={expired ? "vcoupons__expired-text" : ""}>{fmtDate(c.expiryDate)}</span>
                  </div>
                  <div className="vcoupons__meta-row">
                    <span className="vcoupons__meta-label">Used</span>
                    <span>{c.usedCount}{c.usageLimit !== null ? ` / ${c.usageLimit}` : " (unlimited)"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="vcoupons__modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="vcoupons__modal vcoupons__modal--sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="vcoupons__modal-title">Delete Coupon?</h3>
            <p className="vcoupons__modal-body">This cannot be undone. Customers will no longer be able to use this code.</p>
            <div className="vcoupons__modal-actions">
              <button className="vcoupons__cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="vcoupons__delete-confirm-btn" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
