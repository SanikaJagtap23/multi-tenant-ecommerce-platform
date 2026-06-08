import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllStores } from "../../features/store/storeSlice";
import { FiArrowLeft, FiSearch, FiAward, FiPackage } from "react-icons/fi";
import "./StoresPage.css";

const STORE_GRADIENTS = [
  ["#6366f1", "#a855f7"],
  ["#f43f5e", "#ec4899"],
  ["#f97316", "#f59e0b"],
  ["#22c55e", "#14b8a6"],
  ["#3b82f6", "#06b6d4"],
  ["#a855f7", "#6366f1"],
  ["#f59e0b", "#f97316"],
  ["#14b8a6", "#22c55e"],
  ["#6366f1", "#3b82f6"],
  ["#ec4899", "#f97316"],
];

export default function StoresPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { stores, loading } = useSelector((s) => s.store);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllStores());
  }, [dispatch]);

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sp2-page">

      {/* ── HEADER ── */}
      <div className="sp2-header">
        <div className="sp2-header__inner">
          <button className="sp2-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} /> Back
          </button>
          <div className="sp2-header__title-row">
            <h1>
              <FiAward className="sp2-award-icon" /> All Stores
            </h1>
            <span className="sp2-count">{stores.length} stores</span>
          </div>
          <div className="sp2-search-wrap">
            <FiSearch className="sp2-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search stores or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sp2-search"
            />
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="sp2-body">
        <div className="sp2-body__inner">
          {loading ? (
            <div className="sp2-loading">
              <div className="sp2-loading__spinner" />
              <p>Loading stores...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="sp2-empty">
              <FiPackage size={48} />
              <h3>{search ? "No stores match your search" : "No stores available"}</h3>
              {search && <button onClick={() => setSearch("")}>Clear search</button>}
            </div>
          ) : (
            <div className="sp2-grid">
              {filtered.map((store, i) => {
                const [from, to] = STORE_GRADIENTS[i % STORE_GRADIENTS.length];
                const gradient   = `linear-gradient(to right, ${from}, ${to})`;
                const gradientBr = `linear-gradient(to bottom right, ${from}, ${to})`;
                return (
                  <Link key={store._id} to={`/store/${store._id}`} className="sp2-card">
                    <div className="sp2-card__accent" style={{ background: gradient }} />
                    <div className="sp2-card__body">
                      <div className="sp2-card__logo" style={{ background: gradientBr }}>
                        {store.logo
                          ? <img src={store.logo} alt={store.name} />
                          : store.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="sp2-card__info">
                        <p className="sp2-card__name">{store.name}</p>
                        <p className="sp2-card__cat">{store.category}</p>
                        {store.description && (
                          <p className="sp2-card__desc">{store.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
