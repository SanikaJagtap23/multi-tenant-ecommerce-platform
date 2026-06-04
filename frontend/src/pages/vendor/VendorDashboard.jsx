import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMyStore } from "../../features/store/storeSlice";
import { fetchMyProducts } from "../../features/product/productSlice";
import { FiShoppingBag, FiPackage, FiPlusCircle, FiSettings } from "react-icons/fi";
import Spinner from "../../components/common/Spinner";
import "./VendorDashboard.css";

export default function VendorDashboard() {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { myStore, loading: storeLoading } = useSelector((state) => state.store);
  const { myProducts } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchMyStore());
    dispatch(fetchMyProducts());
  }, [dispatch]);

  const activeProducts = myProducts.filter((p) => p.isActive).length;
  const totalStock = myProducts.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="vdash-page">
      <div className="vdash-header">
        <h1 className="vdash-title">
          Welcome back, {userInfo?.name}
        </h1>
        <p className="vdash-subtitle">Manage your store and products</p>
      </div>

      {storeLoading ? (
        <div className="spinner-center">
          <Spinner />
        </div>
      ) : !myStore ? (
        <div className="vdash-no-store">
          <div className="vdash-no-store__header">
            <FiShoppingBag className="vdash-no-store__icon" />
            <h2 className="vdash-no-store__heading">
              No Store Yet
            </h2>
          </div>
          <p className="vdash-no-store__text">
            You haven&apos;t created your store yet. Create one to start selling.
          </p>
          <Link to="/vendor/store" className="vdash-no-store__btn">
            <FiPlusCircle /> Create Your Store
          </Link>
        </div>
      ) : (
        <div className="vdash-store-banner">
          <div className="vdash-store-banner__left">
            {myStore.logo ? (
              <img
                src={myStore.logo}
                alt={myStore.name}
                className="vdash-store-logo"
              />
            ) : (
              <div className="vdash-store-logo--placeholder">
                {myStore.name[0]}
              </div>
            )}
            <div className="vdash-store-info">
              <h2 className="vdash-store-name">{myStore.name}</h2>
              <span className="vdash-store-category">
                {myStore.category}
              </span>
              <div className="vdash-store-status">
                <span className={`vdash-store-badge ${myStore.isActive ? "vdash-store-badge--active" : "vdash-store-badge--inactive"}`}>
                  {myStore.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <Link to="/vendor/store" className="vdash-store-manage-btn">
            <FiSettings /> Manage Store
          </Link>
        </div>
      )}

      <div className="vdash-stats">
        <div className="stats-card">
          <div className="stats-card__icon-wrap icon--indigo">
            <FiPackage />
          </div>
          <p className="stats-card__value">{myProducts.length}</p>
          <p className="stats-card__label">Total Products</p>
        </div>
        <div className="stats-card">
          <div className="stats-card__icon-wrap icon--green">
            <FiPackage />
          </div>
          <p className="stats-card__value">{activeProducts}</p>
          <p className="stats-card__label">Active Products</p>
        </div>
        <div className="stats-card">
          <div className="stats-card__icon-wrap icon--purple">
            <FiShoppingBag />
          </div>
          <p className="stats-card__value">{totalStock}</p>
          <p className="stats-card__label">Total Stock Units</p>
        </div>
      </div>

      <div className="vdash-actions">
        <Link to="/vendor/products" className="vdash-action-card">
          <div className="vdash-action-card__inner">
            <div className="vdash-action-icon">
              <FiPackage />
            </div>
            <div>
              <h3 className="vdash-action-title">Manage Products</h3>
              <p className="vdash-action-desc">Add, edit or remove products</p>
            </div>
          </div>
        </Link>

        <Link to="/vendor/products/new" className="vdash-action-card vdash-action-card--primary">
          <div className="vdash-action-card__inner">
            <div className="vdash-action-icon vdash-action-icon--primary">
              <FiPlusCircle />
            </div>
            <div>
              <h3 className="vdash-action-title">Add New Product</h3>
              <p className="vdash-action-desc">List a new item for sale</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
