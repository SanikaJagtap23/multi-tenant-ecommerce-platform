import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminStores,
  toggleAdminStoreStatus,
  deleteAdminStore,
} from "../../features/admin/adminSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import {
  FiSearch, FiShoppingBag, FiToggleLeft, FiToggleRight,
  FiTrash2, FiChevronLeft, FiChevronRight, FiFilter,
} from "react-icons/fi";
import "./AdminStoresPage.css";

const CATEGORY_COLORS = {
  "Electronics":           "blue",
  "Fashion":               "purple",
  "Home & Living":         "amber",
  "Sports & Fitness":      "green",
  "Books":                 "indigo",
  "Beauty & Personal Care":"rose",
  "Toys & Games":          "orange",
  "Food & Beverages":      "teal",
};

export default function AdminStoresPage() {
  const dispatch = useDispatch();
  const { stores, storesTotal, loading } = useSelector((s) => s.admin);

  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("all");
  const [page,    setPage]    = useState(1);
  const [confirm, setConfirm] = useState(null);

  const LIMIT = 15;
  const pages = Math.ceil(storesTotal / LIMIT);

  const load = useCallback(() => {
    dispatch(fetchAdminStores({
      status: status !== "all" ? status : undefined,
      search: search || undefined,
      page,
      limit: LIMIT,
    }));
  }, [dispatch, status, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, search]);

  const handleToggle = async (store) => {
    const result = await dispatch(toggleAdminStoreStatus({ id: store._id, isActive: !store.isActive }));
    if (toggleAdminStoreStatus.fulfilled.match(result)) {
      toast.success(store.isActive ? `"${store.name}" deactivated` : `"${store.name}" activated`);
    } else {
      toast.error(result.payload || "Failed");
    }
    setConfirm(null);
  };

  const handleDelete = async (store) => {
    const result = await dispatch(deleteAdminStore(store._id));
    if (deleteAdminStore.fulfilled.match(result)) {
      toast.success(`"${store.name}" deleted`);
    } else {
      toast.error(result.payload || "Failed");
    }
    setConfirm(null);
  };

  return (
    <div className="astores">
      <div className="astores__header">
        <div>
          <h1 className="astores__title">Stores</h1>
          <p className="astores__subtitle">{storesTotal} total stores registered</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="astores__toolbar">
        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="astores__search"
        >
          <FiSearch className="astores__search-icon" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name…"
            className="astores__search-input"
          />
        </form>

        <div className="astores__filter-row">
          <FiFilter size={14} style={{ color: "var(--clr-text-400)" }} />
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              className={`astores__filter-btn${status === s ? " astores__filter-btn--active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="astores__spinner"><Spinner /></div>
      ) : stores.length === 0 ? (
        <div className="astores__empty">
          <FiShoppingBag size={40} />
          <p>No stores found</p>
        </div>
      ) : (
        <div className="astores__table-wrap">
          <table className="astores__table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Owner</th>
                <th>Category</th>
                <th style={{ textAlign: "center" }}>Products</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => {
                const initial    = (store.name || "S")[0].toUpperCase();
                const catColor   = CATEGORY_COLORS[store.category] || "blue";
                return (
                  <tr key={store._id}>
                    <td>
                      <div className="astores__store-cell">
                        <div className="astores__logo">
                          {store.logo
                            ? <img src={store.logo} alt={store.name} className="astores__logo-img" />
                            : <span>{initial}</span>
                          }
                        </div>
                        <div>
                          <p className="astores__store-name">{store.name}</p>
                          {store.contactEmail && (
                            <p className="astores__store-email">{store.contactEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="astores__owner-name">{store.owner?.name || "—"}</p>
                      <p className="astores__owner-email">{store.owner?.email || ""}</p>
                    </td>
                    <td>
                      <span className={`astores__cat-badge astores__cat-badge--${catColor}`}>
                        {store.category || "—"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="astores__product-count">{store.productCount || 0}</span>
                    </td>
                    <td>
                      <span className={`astores__status ${store.isActive ? "astores__status--active" : "astores__status--inactive"}`}>
                        {store.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="astores__actions">
                        <button
                          className={`astores__toggle-btn ${store.isActive ? "astores__toggle-btn--deactivate" : "astores__toggle-btn--activate"}`}
                          onClick={() => setConfirm({ type: store.isActive ? "deactivate" : "activate", store })}
                          title={store.isActive ? "Deactivate store" : "Activate store"}
                        >
                          {store.isActive
                            ? <><FiToggleLeft size={14} /> Deactivate</>
                            : <><FiToggleRight size={14} /> Activate</>
                          }
                        </button>
                        <button
                          className="astores__delete-btn"
                          onClick={() => setConfirm({ type: "delete", store })}
                          title="Delete store"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
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
        <div className="astores__pagination">
          <button className="astores__page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <FiChevronLeft size={15} />
          </button>
          <span className="astores__page-info">Page {page} of {pages}</span>
          <button className="astores__page-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
            <FiChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="astores__modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="astores__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="astores__modal-title">
              {confirm.type === "activate"   && "Activate Store"}
              {confirm.type === "deactivate" && "Deactivate Store"}
              {confirm.type === "delete"     && "Delete Store"}
            </h3>
            <p className="astores__modal-body">
              {confirm.type === "activate"   && `Activate "${confirm.store.name}"? It will appear publicly.`}
              {confirm.type === "deactivate" && `Deactivate "${confirm.store.name}"? It will be hidden from customers.`}
              {confirm.type === "delete"     && `Permanently delete "${confirm.store.name}"? This cannot be undone.`}
            </p>
            <div className="astores__modal-actions">
              <button className="astores__modal-cancel" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className={`astores__modal-confirm ${confirm.type === "delete" || confirm.type === "deactivate" ? "astores__modal-confirm--danger" : "astores__modal-confirm--primary"}`}
                onClick={() => {
                  if (confirm.type === "delete") handleDelete(confirm.store);
                  else handleToggle(confirm.store);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
