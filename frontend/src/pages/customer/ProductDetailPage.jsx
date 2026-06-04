import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById } from "../../features/product/productSlice";
import { addToCart } from "../../features/cart/cartSlice";
import { fetchWishlist, toggleWishlist } from "../../features/wishlist/wishlistSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import {
  FiShoppingCart, FiArrowLeft, FiStar, FiPackage,
  FiTruck, FiShield, FiHome, FiHeart,
} from "react-icons/fi";
import "./ProductDetailPage.css";

export default function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading } = useSelector((s) => s.product);
  const { items: cartItems } = useSelector((s) => s.cart);
  const { userInfo } = useSelector((s) => s.auth);
  const { ids: wishlistIds } = useSelector((s) => s.wishlist);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(fetchProductById(id));
    setActiveImage(0);
    setQuantity(1);
  }, [id, dispatch]);

  useEffect(() => {
    if (userInfo?.role === "customer") dispatch(fetchWishlist());
  }, [userInfo]);

  const isWishlisted = product ? wishlistIds.includes(product._id) : false;

  const handleToggleWishlist = async () => {
    if (!userInfo) { toast.error("Please sign in first."); navigate("/login"); return; }
    if (userInfo.role !== "customer") { toast.error("Only customers can use the wishlist."); return; }
    const result = await dispatch(toggleWishlist(product._id));
    if (toggleWishlist.fulfilled.match(result)) {
      const added = result.payload.wishlisted;
      toast.success(added ? "Added to wishlist!" : "Removed from wishlist");
      dispatch(fetchWishlist());
    }
  };

  const cartQty = cartItems.find((i) => i.productId === id)?.quantity || 0;
  const maxQty = product ? Math.max(0, product.stock - cartQty) : 0;

  const handleAddToCart = () => {
    if (!userInfo) {
      toast.error("Please login to add items to cart.");
      navigate("/login");
      return;
    }
    if (userInfo.role !== "customer") {
      toast.error("Only customers can shop.");
      return;
    }
    if (!product || product.stock === 0) return;

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "",
        stock: product.stock,
        storeId: product.store?._id || product.store,
        storeName: product.store?.name || "",
        vendorId: product.vendor?._id || product.vendor,
      })
    );
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) return (
    <div className="product-detail-loading">
      <Spinner size="lg" />
    </div>
  );

  if (!product) return (
    <div className="product-detail-notfound">
      <p>Product not found.</p>
      <Link to="/" className="product-detail-back-btn">
        <FiArrowLeft /> Back to shop
      </Link>
    </div>
  );

  const images = product.images?.length ? product.images : [null];
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <div className="product-detail-breadcrumb">
        <nav>
          <Link to="/" className="product-detail-breadcrumb__link">Home</Link>
          <span>/</span>
          {product.store?.name && (
            <>
              <Link to={`/?store=${product.store._id}`} className="product-detail-breadcrumb__link">
                {product.store.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="product-detail-breadcrumb__current">{product.name}</span>
        </nav>
      </div>

      <div className="product-detail-container">
        <div className="product-detail-card">
          <div className="product-detail-grid">
            {/* Image Gallery */}
            <div className="product-detail-gallery">
              <div className="product-detail-main-image">
                {images[activeImage] ? (
                  <img src={images[activeImage]} alt={product.name} />
                ) : (
                  <div className="product-detail-main-image__placeholder">
                    <FiPackage size={80} />
                  </div>
                )}
                {discount > 0 && (
                  <span className="product-detail-main-image__discount">-{discount}%</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="product-detail-thumbnails">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`product-detail-thumb${activeImage === i ? " product-detail-thumb--active" : ""}`}
                    >
                      {img ? (
                        <img src={img} alt="" />
                      ) : (
                        <div className="product-detail-thumb__placeholder">
                          <FiPackage />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="product-detail-info">
              {/* Category + SKU */}
              <div className="product-detail-meta-tags">
                <span className="product-detail-category-tag">{product.category}</span>
                {product.sku && (
                  <span className="product-detail-sku">SKU: {product.sku}</span>
                )}
              </div>

              <h1 className="product-detail-title">{product.name}</h1>

              {/* Store info */}
              {product.store?.name && (
                <Link to={`/?store=${product.store._id}`} className="product-detail-store-link">
                  <FiHome size={14} />
                  <span>{product.store.name}</span>
                </Link>
              )}

              {/* Rating placeholder */}
              <div className="product-detail-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar key={s} style={{ color: "#fbbf24", fill: "#fbbf24" }} size={16} />
                ))}
                <span className="product-detail-stars__label">(4.5) · 128 reviews</span>
              </div>

              {/* Price */}
              <div className="product-detail-pricing">
                <span className="product-detail-price">₹{product.price.toLocaleString()}</span>
                {product.comparePrice > product.price && (
                  <>
                    <span className="product-detail-compare-price">
                      ₹{product.comparePrice.toLocaleString()}
                    </span>
                    <span className="product-detail-discount-badge">{discount}% off</span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="product-detail-description">{product.description}</p>
              )}

              {/* Stock status */}
              <div>
                {product.stock === 0 ? (
                  <span className="product-detail-stock-badge product-detail-stock-badge--out">
                    Out of Stock
                  </span>
                ) : product.stock < 10 ? (
                  <span className="product-detail-stock-badge product-detail-stock-badge--low">
                    Only {product.stock} left in stock!
                  </span>
                ) : (
                  <span className="product-detail-stock-badge product-detail-stock-badge--in">
                    In Stock ({product.stock} available)
                  </span>
                )}
              </div>

              {/* Quantity + Add to Cart */}
              {product.stock > 0 && (
                <div className="product-detail-qty-row">
                  <div className="product-detail-qty-ctrl">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="product-detail-qty-btn"
                    >
                      −
                    </button>
                    <span className="product-detail-qty-value">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQty > 0 ? maxQty : product.stock, q + 1))}
                      className="product-detail-qty-btn"
                    >
                      +
                    </button>
                  </div>
                  <button onClick={handleAddToCart} className="product-detail-add-btn">
                    <FiShoppingCart size={18} />
                    Add to Cart
                  </button>

                  <button
                    onClick={handleToggleWishlist}
                    className={`product-detail-wishlist-btn${isWishlisted ? " product-detail-wishlist-btn--active" : ""}`}
                    title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    <FiHeart size={20} />
                  </button>
                </div>
              )}

              {cartQty > 0 && (
                <p className="product-detail-cart-note">
                  ✓ {cartQty} already in your cart
                  {" · "}
                  <button onClick={() => navigate("/cart")}>View Cart</button>
                </p>
              )}

              {/* Trust badges */}
              <div className="product-detail-trust">
                {[
                  { icon: FiTruck, label: "Free delivery", sub: "Orders above ₹500" },
                  { icon: FiShield, label: "Secure payment", sub: "100% protected" },
                  { icon: FiPackage, label: "Easy returns", sub: "7-day policy" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="product-detail-trust-item">
                    <Icon className="product-detail-trust-item__icon" size={20} />
                    <span className="product-detail-trust-item__label">{label}</span>
                    <span className="product-detail-trust-item__sub">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Back button */}
        <button onClick={() => navigate(-1)} className="product-detail-back-btn">
          <FiArrowLeft size={16} />
          Back
        </button>
      </div>
    </div>
  );
}
