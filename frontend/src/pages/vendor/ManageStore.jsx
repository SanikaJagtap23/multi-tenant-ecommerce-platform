import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyStore,
  createStore,
  updateStore,
  clearStoreState,
} from "../../features/store/storeSlice";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import { FiEdit2, FiMail, FiPhone, FiMapPin, FiX, FiCamera } from "react-icons/fi";
import "./ManageStore.css";

const CATEGORIES = [
  "Electronics", "Fashion & Clothing", "Home & Garden", "Sports & Outdoors",
  "Books & Media", "Health & Beauty", "Toys & Games", "Food & Beverages",
  "Automotive", "Other",
];

const CATEGORY_COLORS = {
  "Electronics":        { bg: "#2563eb" },
  "Fashion & Clothing": { bg: "#f43f5e" },
  "Home & Garden":      { bg: "#059669" },
  "Sports & Outdoors":  { bg: "#f97316" },
  "Books & Media":      { bg: "#7c3aed" },
  "Health & Beauty":    { bg: "#ec4899" },
  "Toys & Games":       { bg: "#f59e0b" },
  "Food & Beverages":   { bg: "#ef4444" },
  "Automotive":         { bg: "#475569" },
  "Other":              { bg: "#4f46e5" },
};

export default function ManageStore() {
  const dispatch = useDispatch();
  const { myStore, loading, error, success } = useSelector((s) => s.store);

  const [editMode, setEditMode] = useState(false);
  const [wasCreating, setWasCreating] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", category: "",
    address: "", contactEmail: "", contactPhone: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => { dispatch(fetchMyStore()); }, [dispatch]);

  useEffect(() => {
    if (myStore) {
      setForm({
        name: myStore.name || "",
        description: myStore.description || "",
        category: myStore.category || "",
        address: myStore.address || "",
        contactEmail: myStore.contactEmail || "",
        contactPhone: myStore.contactPhone || "",
      });
      if (myStore.logo) setPreviewUrl(myStore.logo);
    }
  }, [myStore]);

  useEffect(() => {
    if (success) {
      toast.success(wasCreating ? "Store created successfully!" : "Store updated successfully!");
      dispatch(clearStoreState());
      setEditMode(false);
    }
    if (error) {
      toast.error(error);
      dispatch(clearStoreState());
    }
  }, [success, error]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setLogoFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (logoFile) formData.append("logo", logoFile);
    if (myStore) { setWasCreating(false); dispatch(updateStore({ id: myStore._id, formData })); }
    else { setWasCreating(true); dispatch(createStore(formData)); }
  };

  if (loading && !myStore && !editMode) {
    return <div className="spinner-center" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}><Spinner /></div>;
  }

  // ── VIEW MODE ──
  if (myStore && !editMode) {
    const color = CATEGORY_COLORS[myStore.category] || CATEGORY_COLORS["Other"];

    return (
      <div className="ms-page">
        <div className="ms-header">
          <h1 className="ms-title">My Store</h1>
          <button onClick={() => setEditMode(true)} className="ms-edit-btn">
            <FiEdit2 size={14} /> Edit Store
          </button>
        </div>

        <div className="ms-store-card">
          <div className="ms-store-banner" style={{ backgroundColor: color.bg }}>
            <div className="ms-store-logo">
              {myStore.logo ? (
                <img src={myStore.logo} alt={myStore.name} />
              ) : (
                <span className="ms-store-logo__initial">
                  {myStore.name[0].toUpperCase()}
                </span>
              )}
            </div>

            <h2 className="ms-store-name">{myStore.name}</h2>

            <div className="ms-store-badges">
              <span className="ms-store-badge-category">
                {myStore.category}
              </span>
              <span className={`ms-store-badge-status ${myStore.isActive ? "ms-store-badge-status--active" : "ms-store-badge-status--inactive"}`}>
                {myStore.isActive ? "● Active" : "● Inactive"}
              </span>
            </div>
          </div>

          {myStore.description && (
            <div className="ms-store-desc">
              <p>{myStore.description}</p>
            </div>
          )}

          <div className="ms-store-contacts">
            {myStore.contactEmail && (
              <div className="ms-store-contact-item">
                <span className="ms-store-contact-icon">
                  <FiMail size={16} />
                </span>
                <span className="ms-store-contact-text">{myStore.contactEmail}</span>
              </div>
            )}
            {myStore.contactPhone && (
              <div className="ms-store-contact-item">
                <span className="ms-store-contact-icon">
                  <FiPhone size={16} />
                </span>
                <span className="ms-store-contact-text">{myStore.contactPhone}</span>
              </div>
            )}
            {myStore.address && (
              <div className="ms-store-contact-item">
                <span className="ms-store-contact-icon">
                  <FiMapPin size={16} />
                </span>
                <span className="ms-store-contact-text">{myStore.address}</span>
              </div>
            )}
            {!myStore.contactEmail && !myStore.contactPhone && !myStore.address && (
              <p className="ms-no-contact">
                No contact info — click Edit Store to add details.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── CREATE / EDIT FORM ──
  return (
    <div className="ms-page--wide">
      <div className="ms-header">
        <h1 className="ms-title">
          {myStore ? "Edit Store" : "Create Your Store"}
        </h1>
        {myStore && (
          <button onClick={() => setEditMode(false)} className="ms-cancel-btn">
            <FiX size={14} /> Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="ms-form-card">
        <div className="ms-logo-upload">
          <label className="ms-logo-upload-label">
            <div className="ms-logo-upload-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Logo preview" />
              ) : (
                <div className="ms-logo-upload-icon">
                  <FiCamera size={26} />
                  <span>Upload</span>
                </div>
              )}
              {previewUrl && (
                <div className="ms-logo-upload-overlay">
                  <FiCamera size={22} />
                </div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
          </label>
          <span className="ms-logo-upload-text">Click circle to upload store logo</span>
        </div>

        <div>
          <label className="form-label">
            Store Name <span style={{ color: "var(--clr-red)" }}>*</span>
          </label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required
            placeholder="Store name"
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">
            Category <span style={{ color: "var(--clr-red)" }}>*</span>
          </label>
          <select name="category" value={form.category} onChange={handleChange} required
            className="form-select"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            placeholder="Describe your store"
            className="form-textarea"
          />
        </div>

        <div className="ms-grid-2">
          <div>
            <label className="form-label">Contact Email</label>
            <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange}
              placeholder="Email address"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Contact Phone</label>
            <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange}
              placeholder="Phone number"
              className="form-input"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Address</label>
          <input type="text" name="address" value={form.address} onChange={handleChange}
            placeholder="Store address"
            className="form-input"
          />
        </div>

        <button type="submit" disabled={loading} className="ms-submit-btn">
          {loading ? <Spinner size="sm" /> : null}
          {loading ? "Saving..." : myStore ? "Update Store" : "Create Store"}
        </button>
      </form>
    </div>
  );
}
