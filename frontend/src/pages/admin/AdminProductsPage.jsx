import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProducts } from "../../features/admin/adminSlice";
import api from "../../api/axiosInstance";
import Spinner from "../../components/common/Spinner";
import {
  FiSearch, FiBox, FiChevronLeft, FiChevronRight,
  FiX, FiImage, FiTag, FiAlertTriangle,
} from "react-icons/fi";
import "./AdminProductsPage.css";

const CAT_COLORS = {
  "Electronics":            "blue",
  "Fashion":                "purple",
  "Home & Living":          "amber",
  "Sports & Fitness":       "green",
  "Books":                  "indigo",
  "Beauty & Personal Care": "rose",
  "Toys & Games":           "orange",
  "Food & Beverages":       "teal",
};

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const { products, productsTotal, loading } = useSelector((s) => s.admin);

  const [search,    setSearch]    = useState("");
  const [storeId,   setStoreId]   = useState("all");
  const [page,      setPage]      = useState(1);
  const [storeList, setStoreList] = useState([]);
  const [selected,  setSelected]  = useState(null); // product for drawer

  const LIMIT = 15;
  const pages = Math.ceil(productsTotal / LIMIT);

  // Fetch store names for dropdown (once)
  useEffect(() => {
    api.get("/admin/stores/names")
      .then((r) => setStoreList(r.data.data || []))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    dispatch(fetchAdminProducts({
      search:  search  || undefined,
      storeId: storeId !== "all" ? storeId : undefined,
      page,
      limit: LIMIT,
    }));
  }, [dispatch, search, storeId, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, storeId]);

  return (
    <div className="aprod">

      {/* Toolbar */}
      <div className="aprod__toolbar">
        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="aprod__search">
          <FiSearch className="aprod__search-icon" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or category…"
            className="aprod__search-input"
          />
          {search && (
            <button type="button" className="aprod__search-clear" onClick={() => setSearch("")}>
              <FiX size={13} />
            </button>
          )}
        </form>

        {/* Store filter */}
        <div className="aprod__store-wrap">
          <label className="aprod__store-label">Store</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="aprod__store-select"
          >
            <option value="all">All Stores</option>
            {storeList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}{!s.isActive ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        <p className="aprod__count">{productsTotal} products</p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="aprod__spinner"><Spinner /></div>
      ) : products.length === 0 ? (
        <div className="aprod__empty">
          <FiBox size={40} />
          <p>No products found</p>
        </div>
      ) : (
        <div className="aprod__table-wrap">
          <table className="aprod__table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Store</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "center" }}>Stock</th>
                <th style={{ textAlign: "center" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const catColor = CAT_COLORS[p.category] || "blue";
                const lowStock = p.stock <= 5;
                return (
                  <tr key={p._id}>
                    {/* Product */}
                    <td>
                      <div className="aprod__prod-cell">
                        <div className="aprod__thumb">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className="aprod__thumb-img" />
                            : <FiImage size={16} className="aprod__thumb-placeholder" />
                          }
                        </div>
                        <div className="aprod__prod-info">
                          <p className="aprod__prod-name">{p.name}</p>
                          {p.sku && <p className="aprod__prod-sku">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Store */}
                    <td>
                      <span className="aprod__store-name">{p.store?.name || "—"}</span>
                    </td>

                    {/* Category */}
                    <td>
                      <span className={`aprod__cat aprod__cat--${catColor}`}>
                        {p.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ textAlign: "right" }}>
                      <p className="aprod__price">₹{Number(p.price).toLocaleString("en-IN")}</p>
                      {p.comparePrice > p.price && (
                        <p className="aprod__compare">₹{Number(p.comparePrice).toLocaleString("en-IN")}</p>
                      )}
                    </td>

                    {/* Stock */}
                    <td style={{ textAlign: "center" }}>
                      <span className={`aprod__stock ${lowStock ? "aprod__stock--low" : "aprod__stock--ok"}`}>
                        {lowStock && <FiAlertTriangle size={11} />}
                        {p.stock}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="aprod__view-btn"
                        onClick={() => setSelected(p)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="aprod__pagination">
          <button className="aprod__page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <FiChevronLeft size={15} />
          </button>
          <span className="aprod__page-info">Page {page} of {pages}</span>
          <button className="aprod__page-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
            <FiChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <ProductDrawer product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ── Product Detail Drawer ─────────────────────────────────────────── */
function ProductDrawer({ product: p, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);

  const discount = p.comparePrice > p.price
    ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
    : 0;

  return (
    <>
      <div className="aprod-drawer-backdrop" onClick={onClose} />
      <div className="aprod-drawer">
        {/* Header */}
        <div className="aprod-drawer__head">
          <div>
            <p className="aprod-drawer__crumb">Product Details</p>
            <h2 className="aprod-drawer__title">{p.name}</h2>
          </div>
          <button className="aprod-drawer__close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="aprod-drawer__body">
          {/* Images */}
          <div className="aprod-drawer__images">
            <div className="aprod-drawer__main-img">
              {p.images?.[imgIdx]
                ? <img src={p.images[imgIdx]} alt={p.name} />
                : (
                  <div className="aprod-drawer__no-img">
                    <FiImage size={40} />
                    <span>No image</span>
                  </div>
                )
              }
            </div>
            {p.images?.length > 1 && (
              <div className="aprod-drawer__thumbs">
                {p.images.map((img, i) => (
                  <button
                    key={i}
                    className={`aprod-drawer__thumb-btn${imgIdx === i ? " aprod-drawer__thumb-btn--active" : ""}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <img src={img} alt={`${p.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="aprod-drawer__info">

            {/* Price row */}
            <div className="aprod-drawer__price-row">
              <span className="aprod-drawer__price">
                ₹{Number(p.price).toLocaleString("en-IN")}
              </span>
              {discount > 0 && (
                <>
                  <span className="aprod-drawer__compare">
                    ₹{Number(p.comparePrice).toLocaleString("en-IN")}
                  </span>
                  <span className="aprod-drawer__discount">{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Details */}
            <div className="aprod-drawer__details">
              <DrawerRow label="Store"    value={p.store?.name   || "—"} />
              <DrawerRow label="Vendor"   value={p.vendor?.name  || "—"} />
              <DrawerRow label="Category" value={p.category      || "—"} />
              {p.sku && <DrawerRow label="SKU"   value={p.sku} />}
              <DrawerRow
                label="Stock"
                value={
                  <span className={p.stock <= 5 ? "aprod-drawer__low" : ""}>
                    {p.stock <= 5 && <FiAlertTriangle size={12} style={{ marginRight: "0.25rem" }} />}
                    {p.stock} units
                  </span>
                }
              />
              <DrawerRow
                label="Status"
                value={
                  <span className={`aprod-drawer__status ${p.isActive ? "aprod-drawer__status--active" : "aprod-drawer__status--off"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                }
              />
              <DrawerRow
                label="Listed"
                value={new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              />
            </div>

            {/* Description */}
            {p.description && (
              <div className="aprod-drawer__desc-section">
                <p className="aprod-drawer__desc-label">Description</p>
                <p className="aprod-drawer__desc">{p.description}</p>
              </div>
            )}

            {/* Variants */}
            {p.variants?.length > 0 && (
              <div className="aprod-drawer__variants">
                <p className="aprod-drawer__desc-label">Variants</p>
                {p.variants.map((v, i) => (
                  <div key={i} className="aprod-drawer__variant-row">
                    <FiTag size={12} />
                    <span className="aprod-drawer__variant-name">{v.name}:</span>
                    <span className="aprod-drawer__variant-opts">{v.options?.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerRow({ label, value }) {
  return (
    <div className="aprod-drawer__row">
      <span className="aprod-drawer__row-label">{label}</span>
      <span className="aprod-drawer__row-value">{value}</span>
    </div>
  );
}
