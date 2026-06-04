import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  fetchProductById,
  clearProductState,
} from "../../features/product/productSlice";
import { fetchMyStore } from "../../features/store/storeSlice";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import { FiUpload, FiX } from "react-icons/fi";
import "./AddEditProduct.css";

const CATEGORIES = [
  "Electronics",
  "Fashion & Clothing",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Health & Beauty",
  "Toys & Games",
  "Food & Beverages",
  "Automotive",
  "Other",
];

export default function AddEditProduct() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { loading, error, success, selectedProduct } = useSelector(
    (s) => s.product
  );
  const { myStore } = useSelector((s) => s.store);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    category: "",
    stock: "",
    sku: "",
    isActive: true,
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    if (isEditing) dispatch(fetchProductById(id));
    if (!myStore) dispatch(fetchMyStore());
    return () => dispatch(clearProductState());
  }, [id]);

  useEffect(() => {
    if (!isEditing && myStore?.category) {
      setForm((prev) => ({ ...prev, category: myStore.category }));
    }
  }, [myStore, isEditing]);

  useEffect(() => {
    if (isEditing && selectedProduct) {
      setForm({
        name: selectedProduct.name || "",
        description: selectedProduct.description || "",
        price: selectedProduct.price || "",
        comparePrice: selectedProduct.comparePrice || "",
        category: selectedProduct.category || "",
        stock: selectedProduct.stock || "",
        sku: selectedProduct.sku || "",
        isActive: selectedProduct.isActive,
      });
      if (selectedProduct.images?.length) {
        setPreviewUrls(selectedProduct.images);
      }
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (success) {
      toast.success(isEditing ? "Product updated!" : "Product created!");
      dispatch(clearProductState());
      navigate("/vendor/products");
    }
    if (error) {
      toast.error(error);
      dispatch(clearProductState());
    }
  }, [success, error]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
  };

  const removePreview = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    imageFiles.forEach((file) => formData.append("images", file));

    if (isEditing) {
      dispatch(updateProduct({ id, formData }));
    } else {
      dispatch(createProduct(formData));
    }
  };

  return (
    <div className="aep-page">
      <h1 className="aep-title">
        {isEditing ? "Edit Product" : "Add New Product"}
      </h1>

      <form onSubmit={handleSubmit} className="aep-form">
        <div className="aep-image-section">
          <label className="form-label">Product Images (up to 5)</label>
          <div className="aep-image-previews">
            {previewUrls.map((url, i) => (
              <div key={i} className="aep-image-preview">
                <img
                  src={url}
                  alt={`preview ${i}`}
                  className="aep-image-preview__img"
                />
                {imageFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removePreview(i)}
                    className="aep-image-remove-btn"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ))}
          </div>
          <label className="aep-upload-label">
            <FiUpload /> Upload Images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <div className="aep-field">
          <label className="form-label">
            Product Name <span style={{ color: "var(--clr-red)" }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Wireless Headphones"
            className="form-input"
          />
        </div>

        <div className="aep-field">
          <label className="form-label">
            Category <span style={{ color: "var(--clr-red)" }}>*</span>
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="aep-field">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your product..."
            className="form-textarea"
          />
        </div>

        <div className="aep-grid-2">
          <div className="aep-field">
            <label className="form-label">
              Price (₹) <span style={{ color: "var(--clr-red)" }}>*</span>
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="form-input"
            />
          </div>
          <div className="aep-field">
            <label className="form-label">Compare Price (₹)</label>
            <input
              type="number"
              name="comparePrice"
              value={form.comparePrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="form-input"
            />
          </div>
        </div>

        <div className="aep-grid-2">
          <div className="aep-field">
            <label className="form-label">
              Stock Quantity <span style={{ color: "var(--clr-red)" }}>*</span>
            </label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              required
              min="0"
              placeholder="0"
              className="form-input"
            />
          </div>
          <div className="aep-field">
            <label className="form-label">SKU</label>
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="e.g. WH-1234"
              className="form-input"
            />
          </div>
        </div>

        <div className="aep-checkbox-row">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
          />
          <label htmlFor="isActive">Make product visible in store</label>
        </div>

        <div className="aep-form-actions">
          <button
            type="button"
            onClick={() => navigate("/vendor/products")}
            className="aep-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="aep-submit-btn"
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? "Saving..." : isEditing ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
