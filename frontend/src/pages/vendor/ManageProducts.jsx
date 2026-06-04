import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchMyProducts,
  deleteProduct,
  clearProductState,
} from "../../features/product/productSlice";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiTag, FiAlertTriangle } from "react-icons/fi";
import "./ManageProducts.css";

export default function ManageProducts() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myProducts, loading, error, success } = useSelector((s) => s.product);

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  useEffect(() => {
    dispatch(fetchMyProducts());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success("Product deleted successfully");
      dispatch(clearProductState());
    }
    if (error) {
      toast.error(error);
      dispatch(clearProductState());
    }
  }, [success, error]);

  const handleDeleteClick = (id, name) => setDeleteTarget({ id, name });

  const handleDeleteConfirm = () => {
    dispatch(deleteProduct(deleteTarget.id));
    setDeleteTarget(null);
  };

  const stockClass = (stock) => {
    if (stock === 0) return "mp-product-stock-value--out";
    if (stock < 10) return "mp-product-stock-value--low";
    return "mp-product-stock-value--ok";
  };

  return (
    <div className="mp-page">
      <div className="mp-header">
        <div>
          <h1 className="mp-title">My Products</h1>
          <p className="mp-count">
            {myProducts.length} product{myProducts.length !== 1 ? "s" : ""} in your store
          </p>
        </div>
        <Link to="/vendor/products/new" className="btn btn-primary btn-sm">
          <FiPlus size={16} /> Add Product
        </Link>
      </div>

      {loading ? (
        <div className="spinner-center"><Spinner /></div>
      ) : myProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon icon--indigo">
            <FiPackage />
          </div>
          <h3 className="empty-state__title">No products yet</h3>
          <p className="empty-state__text">Add your first product to start selling.</p>
          <Link to="/vendor/products/new" className="btn btn-primary">
            <FiPlus /> Add First Product
          </Link>
        </div>
      ) : (
        <div className="mp-grid">
          {myProducts.map((product) => (
            <div key={product._id} className="mp-product-card">
              <div className="mp-product-image">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                  />
                ) : (
                  <div className="mp-product-image__empty">
                    <FiPackage />
                    <span>No image</span>
                  </div>
                )}

                <span className={`mp-product-status-badge ${product.isActive ? "mp-product-status-badge--active" : "mp-product-status-badge--hidden"}`}>
                  {product.isActive ? "Active" : "Hidden"}
                </span>

                {product.comparePrice > product.price && (
                  <span className="mp-product-discount-badge">
                    -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                  </span>
                )}
              </div>

              <div className="mp-product-body">
                <div className="mp-product-category">
                  <FiTag size={11} />
                  <span>{product.category}</span>
                </div>

                <h3 className="mp-product-name">{product.name}</h3>

                <div className="mp-product-pricing">
                  <div>
                    <span className="mp-product-price">
                      ₹{product.price.toFixed(2)}
                    </span>
                    {product.comparePrice > product.price && (
                      <span className="mp-product-compare">
                        ₹{product.comparePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="mp-product-stock-label">Stock</p>
                    <p className={`mp-product-stock-value ${stockClass(product.stock)}`}>
                      {product.stock}
                    </p>
                  </div>
                </div>

                <div className="mp-product-actions">
                  <button
                    onClick={() => navigate(`/vendor/products/edit/${product._id}`)}
                    className="mp-product-edit-btn"
                  >
                    <FiEdit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product._id, product.name)}
                    className="mp-product-delete-btn"
                  >
                    <FiTrash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="mp-delete-modal">
          <div className="mp-delete-modal__card">
            <div className="mp-delete-modal__accent" />

            <div className="mp-delete-modal__content">
              <div className="mp-delete-modal__icon">
                <FiAlertTriangle />
              </div>

              <h3 className="mp-delete-modal__title">Delete Product?</h3>
              <p className="mp-delete-modal__body">
                You are about to delete{" "}
                <strong>"{deleteTarget.name}"</strong>.
                <br />
                This action <em>cannot be undone</em>.
              </p>

              <div className="mp-delete-modal__actions">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="mp-delete-modal__cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="mp-delete-modal__confirm"
                >
                  {loading ? <Spinner size="sm" /> : <FiTrash2 size={15} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
