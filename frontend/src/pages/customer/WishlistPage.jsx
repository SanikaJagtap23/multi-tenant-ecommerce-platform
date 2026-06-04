import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchWishlist, toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { addToCart } from "../../features/cart/cartSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import { FiHeart, FiShoppingCart, FiPackage, FiShoppingBag } from "react-icons/fi";
import "./WishlistPage.css";

export default function WishlistPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { userInfo } = useSelector((s) => s.auth);
  const { items, loading } = useSelector((s) => s.wishlist);

  useEffect(() => {
    if (!userInfo) { navigate("/login"); return; }
    dispatch(fetchWishlist());
  }, [userInfo]);

  const handleRemove = async (productId, name) => {
    await dispatch(toggleWishlist(productId));
    // Re-fetch to sync populated items
    dispatch(fetchWishlist());
    toast.success(`${name} removed from wishlist`);
  };

  const handleAddToCart = (product) => {
    if (!userInfo) { navigate("/login"); return; }
    if (userInfo.role !== "customer") { toast.error("Only customers can add to cart"); return; }
    if (product.stock === 0) { toast.error("This product is out of stock"); return; }

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      stock: product.stock,
      storeId: product.store?._id || product.store,
      storeName: product.store?.name || "",
      vendorId: product.vendor?._id || product.vendor,
    }));
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1 className="wishlist-title">
            <FiHeart className="wishlist-title__icon" />
            My Wishlist
            <span className="wishlist-count">
              {!loading && `(${items.length} item${items.length !== 1 ? "s" : ""})`}
            </span>
          </h1>
        </div>

        {loading ? (
          <div className="spinner-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="wishlist-empty">
            <FiHeart className="wishlist-empty__icon" size={56} />
            <h2 className="wishlist-empty__title">Your wishlist is empty</h2>
            <p className="wishlist-empty__desc">
              Save items you love by clicking the heart icon on any product.
            </p>
            <Link to="/" className="btn btn-primary">
              <FiShoppingBag size={16} /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map((product) => {
              const discount = product.comparePrice > product.price
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0;
              return (
                <div key={product._id} className="wishlist-card">
                  {/* Image */}
                  <div className="wishlist-card__image-wrap">
                    <Link to={`/product/${product._id}`}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="wishlist-card__image"
                        />
                      ) : (
                        <div className="wishlist-card__placeholder">
                          <FiPackage size={40} />
                        </div>
                      )}
                    </Link>

                    {/* Remove (heart) button */}
                    <button
                      className="wishlist-card__remove-btn"
                      onClick={() => handleRemove(product._id, product.name)}
                      title="Remove from wishlist"
                    >
                      <FiHeart size={15} style={{ fill: "var(--clr-red)" }} />
                    </button>

                    {product.stock === 0 && (
                      <div className="wishlist-card__out-badge">
                        <span>Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="wishlist-card__body">
                    <p className="wishlist-card__category">{product.category}</p>
                    <Link to={`/product/${product._id}`} className="wishlist-card__name">
                      {product.name}
                    </Link>

                    <div className="wishlist-card__pricing">
                      <span className="wishlist-card__price">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.comparePrice > product.price && (
                        <>
                          <span className="wishlist-card__compare">
                            ₹{product.comparePrice.toLocaleString()}
                          </span>
                          <span className="wishlist-card__discount">{discount}% off</span>
                        </>
                      )}
                    </div>

                    {userInfo?.role === "customer" && (
                      <button
                        className="wishlist-card__add-btn"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                      >
                        <FiShoppingCart size={14} />
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
