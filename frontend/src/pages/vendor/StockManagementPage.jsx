import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyProducts, updateProduct } from "../../features/product/productSlice";
import { fetchVendorAnalytics } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FiPackage, FiAlertTriangle, FiCheckCircle, FiEdit2, FiX, FiCheck } from "react-icons/fi";
import "./StockManagementPage.css";

const stockBadgeClass = (qty) => {
  if (qty === 0) return "stock-badge--out";
  if (qty < 10) return "stock-badge--low";
  return "stock-badge--ok";
};

const stockStatusClass = (qty) => {
  if (qty === 0) return "stock-status-text--out";
  if (qty < 10) return "stock-status-text--low";
  return "stock-status-text--ok";
};

const barColor = (qty) => {
  if (qty === 0) return "#EF4444";
  if (qty < 10) return "#F59E0B";
  return "#10B981";
};

export default function StockManagementPage() {
  const dispatch = useDispatch();
  const { myProducts, loading } = useSelector((s) => s.product);
  const { vendorAnalytics } = useSelector((s) => s.order);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  useEffect(() => {
    dispatch(fetchMyProducts());
    dispatch(fetchVendorAnalytics());
  }, [dispatch]);

  const handleSaveStock = async (product) => {
    const newStock = parseInt(editValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Enter a valid stock quantity (0 or more).");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("stock", newStock);
      await axiosInstance.put(`/products/${product._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(fetchMyProducts());
      dispatch(fetchVendorAnalytics());
      toast.success(`Stock updated for "${product.name}".`);
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stock.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = myProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter =
      filterMode === "all" ||
      (filterMode === "out" && p.stock === 0) ||
      (filterMode === "low" && p.stock > 0 && p.stock < 10) ||
      (filterMode === "ok" && p.stock >= 10);
    return matchSearch && matchFilter;
  });

  const topProducts = vendorAnalytics?.topProducts || [];

  return (
    <div className="stock-page">
      <div className="stock-header">
        <h1 className="stock-title">Stock Management</h1>
        <div className="stock-summary-indicators">
          <span className="stock-indicator stock-indicator--out">
            <span className="stock-indicator-dot stock-indicator-dot--out" />
            {myProducts.filter((p) => p.stock === 0).length} out of stock
          </span>
          <span className="stock-indicator stock-indicator--low">
            <span className="stock-indicator-dot stock-indicator-dot--low" />
            {myProducts.filter((p) => p.stock > 0 && p.stock < 10).length} low
          </span>
        </div>
      </div>

      <div className="stock-kpi-grid">
        {[
          { label: "Total Products", value: myProducts.length, icon: FiPackage, iconClass: "icon--indigo" },
          { label: "In Stock", value: myProducts.filter((p) => p.stock >= 10).length, icon: FiCheckCircle, iconClass: "icon--green" },
          { label: "Low Stock", value: myProducts.filter((p) => p.stock > 0 && p.stock < 10).length, icon: FiAlertTriangle, iconClass: "icon--amber" },
          { label: "Out of Stock", value: myProducts.filter((p) => p.stock === 0).length, icon: FiX, iconClass: "icon--red" },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="stats-card">
            <div className={`stats-card__icon-wrap ${iconClass}`}>
              <Icon size={18} />
            </div>
            <p className="stats-card__value">{value}</p>
            <p className="stats-card__label">{label}</p>
          </div>
        ))}
      </div>

      {myProducts.length > 0 && (
        <div className="stock-chart-card">
          <h2 className="stock-chart-card__title">Stock Levels</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={myProducts.slice(0, 10).map((p) => ({
                name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
                stock: p.stock,
              }))}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="stock" radius={[4, 4, 0, 0]} name="Stock">
                {myProducts.slice(0, 10).map((p, i) => (
                  <Cell key={i} fill={barColor(p.stock)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="stock-chart-legend">
            <span className="stock-chart-legend-item">
              <span className="stock-chart-legend-dot stock-chart-legend-dot--ok" /> In stock (≥10)
            </span>
            <span className="stock-chart-legend-item">
              <span className="stock-chart-legend-dot stock-chart-legend-dot--low" /> Low stock (&lt;10)
            </span>
            <span className="stock-chart-legend-item">
              <span className="stock-chart-legend-dot stock-chart-legend-dot--out" /> Out of stock
            </span>
          </div>
        </div>
      )}

      {topProducts.length > 0 && (
        <div className="stock-bestsellers-table">
          <h2 className="stock-bestsellers-table__title">Best Selling Products</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: "right" }}>Units Sold</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: "#1f2937" }}>{p.name}</td>
                    <td style={{ textAlign: "right", color: "var(--clr-text-600)" }}>{p.unitsSold}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--clr-primary)" }}>₹{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="stock-table-card">
        <div className="stock-table-filters">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="stock-search-input"
          />
          <div className="stock-filter-group">
            {["all", "out", "low", "ok"].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`stock-filter-btn${filterMode === m ? " stock-filter-btn--active" : ""}`}
              >
                {m === "all" ? "All" : m === "out" ? "Out of stock" : m === "low" ? "Low stock" : "In stock"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="spinner-center"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <p className="stock-empty-msg">No products found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: "center" }}>Stock</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center" }}>Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="stock-product-cell">
                        <div className="stock-product-thumb">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" />
                          ) : (
                            <div className="stock-product-thumb__empty">
                              <FiPackage size={14} style={{ color: "#d1d5db" }} />
                            </div>
                          )}
                        </div>
                        <span className="stock-product-name">{product.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--clr-text-500)", fontSize: "0.75rem" }}>{product.category}</td>
                    <td style={{ textAlign: "center" }}>
                      {editingId === product._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="stock-edit-input"
                          autoFocus
                        />
                      ) : (
                        <span className={`stock-badge ${stockBadgeClass(product.stock)}`}>
                          {product.stock}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`stock-status-text ${stockStatusClass(product.stock)}`}>
                        {product.stock === 0 ? "Out of stock" :
                         product.stock < 10 ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {editingId === product._id ? (
                        <div className="stock-action-btns">
                          <button
                            onClick={() => handleSaveStock(product)}
                            disabled={saving}
                            className="stock-action-btn stock-action-btn--save"
                          >
                            <FiCheck size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="stock-action-btn stock-action-btn--cancel"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(product._id); setEditValue(String(product.stock)); }}
                          className="stock-action-btn stock-action-btn--edit"
                        >
                          <FiEdit2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
