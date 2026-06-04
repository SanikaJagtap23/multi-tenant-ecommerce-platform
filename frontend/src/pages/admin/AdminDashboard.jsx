import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAllStores } from "../../features/store/storeSlice";
import { fetchAllProducts } from "../../features/product/productSlice";
import Spinner from "../../components/common/Spinner";
import { FiShoppingBag, FiPackage, FiUsers, FiTrendingUp } from "react-icons/fi";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { stores, loading: storeLoading } = useSelector((s) => s.store);
  const { products } = useSelector((s) => s.product);
  const { userInfo } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchAllStores());
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const activeStores = stores.filter((s) => s.isActive).length;

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">Admin Dashboard</h1>
          <p className="admin-dash-subtitle">Platform overview — logged in as {userInfo?.name}</p>
        </div>
        <Link to="/admin/analytics" className="admin-dash-analytics-link">
          <FiTrendingUp size={15} /> Analytics
        </Link>
      </div>

      {storeLoading ? (
        <div className="spinner-center"><Spinner /></div>
      ) : (
        <>
          <div className="admin-dash-kpi-grid">
            <div className="stats-card">
              <div className="stats-card__icon-wrap icon--indigo">
                <FiShoppingBag />
              </div>
              <p className="stats-card__value">{stores.length}</p>
              <p className="stats-card__label">Total Stores</p>
              <p style={{ fontSize: "0.75rem", color: "var(--clr-text-400)", marginTop: "0.25rem" }}>{activeStores} active</p>
            </div>
            <div className="stats-card">
              <div className="stats-card__icon-wrap icon--purple">
                <FiPackage />
              </div>
              <p className="stats-card__value">{products.length}</p>
              <p className="stats-card__label">Total Products</p>
            </div>
            <div className="stats-card">
              <div className="stats-card__icon-wrap icon--green">
                <FiUsers />
              </div>
              <p className="stats-card__value">{stores.length}</p>
              <p className="stats-card__label">Vendors</p>
              <p style={{ fontSize: "0.75rem", color: "var(--clr-text-400)", marginTop: "0.25rem" }}>registered vendors</p>
            </div>
          </div>

          <div className="admin-dash-stores-section">
            <h2 className="admin-dash-stores-title">All Stores</h2>
            <div className="admin-dash-stores-card">
              {stores.length === 0 ? (
                <p className="admin-dash-empty">No stores registered yet.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Store</th>
                      <th>Owner</th>
                      <th>Category</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store) => (
                      <tr key={store._id}>
                        <td style={{ fontWeight: 500, color: "var(--clr-text-900)" }}>
                          {store.name}
                        </td>
                        <td style={{ color: "var(--clr-text-500)" }}>
                          {store.owner?.name || "—"}
                        </td>
                        <td style={{ color: "var(--clr-text-500)" }}>
                          {store.category}
                        </td>
                        <td>
                          <span className={`admin-dash-store-status-badge ${store.isActive ? "admin-dash-store-status-badge--active" : "admin-dash-store-status-badge--inactive"}`}>
                            {store.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
