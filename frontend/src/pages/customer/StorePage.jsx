import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axiosInstance";
import { addToCart } from "../../features/cart/cartSlice";
import { fetchWishlist, toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { openAuthModal } from "../../features/auth/authSlice";
import toast from "react-hot-toast";
import {
  FiArrowLeft, FiShoppingCart, FiStar, FiPackage,
  FiMapPin, FiPhone, FiMail, FiHeart, FiShoppingBag,
} from "react-icons/fi";
import "./StorePage.css";

const STORE_GRADIENTS = [
  ["#6366f1", "#a855f7"],
  ["#f43f5e", "#ec4899"],
  ["#f97316", "#f59e0b"],
  ["#22c55e", "#14b8a6"],
  ["#3b82f6", "#06b6d4"],
  ["#a855f7", "#6366f1"],
  ["#f59e0b", "#f97316"],
  ["#14b8a6", "#22c55e"],
];

function getGradient(name = "") {
  const idx = name.charCodeAt(0) % STORE_GRADIENTS.length;
  return STORE_GRADIENTS[idx];
}

export default function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((s) => s.auth);
  const { items: cartItems } = useSelector((s) => s.cart);
  const { ids: wishlistIds } = useSelector((s) => s.wishlist);

  const [store, setStore]       = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/stores/${id}`),
      api.get("/products", { params: { storeId: id } }),
    ])
      .then(([storeRes, prodRes]) => {
        setStore(storeRes.data.data);
        setProducts(prodRes.data.data || []);
      })
      .catch(() => setError("Could not load this store."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (userInfo?.role === "customer") dispatch(fetchWishlist());
  }, [userInfo]);

  const handleAddToCart = (product) => {
    if (!userInfo) { dispatch(openAuthModal("customer")); return; }
    if (userInfo.role !== "customer") { toast.error("Only customers can shop."); return; }
    if (!product || product.stock === 0) return;
    const cartQty = cartItems.find((i) => i.productId === product._id)?.quantity || 0;
    if (cartQty >= product.stock) { toast.error("No more stock available."); return; }
    dispatch(addToCart({ productId: product._id, name: product.name, price: product.price, image: product.images?.[0] || "", stock: product.stock, quantity: 1 }));
    toast.success("Added to cart!");
  };

  const handleWishlist = async (product) => {
    if (!userInfo) { dispatch(openAuthModal("customer")); return; }
    if (userInfo.role !== "customer") { toast.error("Only customers can use the wishlist."); return; }
    const result = await dispatch(toggleWishlist(product._id));
    if (toggleWishlist.fulfilled.match(result)) {
      const added = result.payload.wishlisted;
      toast.success(added ? "Added to wishlist!" : "Removed from wishlist");
      dispatch(fetchWishlist());
    }
  };

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-loading__spinner" />
        <p>Loading store...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="sp-error">
        <FiShoppingBag size={48} />
        <h2>Store not found</h2>
        <p>{error || "This store may no longer be active."}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const [gradFrom, gradTo] = getGradient(store.name);
  const gradient = `linear-gradient(135deg, ${gradFrom}, ${gradTo})`;
  const discount = (p) => p.comparePrice > p.price
    ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
    : 0;

  return (
    <div className="sp-page">

      {/* ── BACK ── */}
      <div className="sp-back-bar">
        <div className="sp-back-bar__inner">
          <button className="sp-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} /> Back
          </button>
          <nav className="sp-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>{store.name}</span>
          </nav>
        </div>
      </div>

      {/* ── STORE HERO ── */}
      <section className="sp-hero" style={{ background: gradient }}>
        <div className="sp-hero__deco" />
        <div className="sp-hero__inner">
          <div className="sp-hero__logo">
            {store.logo
              ? <img src={store.logo} alt={store.name} />
              : store.name.charAt(0).toUpperCase()
            }
          </div>
          <div className="sp-hero__info">
            <span className="sp-hero__badge">{store.category}</span>
            <h1 className="sp-hero__name">{store.name}</h1>
            {store.description && (
              <p className="sp-hero__desc">{store.description}</p>
            )}
            <div className="sp-hero__meta">
              <span><FiPackage size={14} /> {products.length} Products</span>
              {store.address && <span><FiMapPin size={14} /> {store.address}</span>}
            </div>
          </div>
        </div>

        {/* Contact bar */}
        {(store.contactEmail || store.contactPhone) && (
          <div className="sp-contact-bar">
            <div className="sp-contact-bar__inner">
              {store.contactEmail && (
                <a href={`mailto:${store.contactEmail}`} className="sp-contact-item">
                  <FiMail size={14} /> {store.contactEmail}
                </a>
              )}
              {store.contactPhone && (
                <a href={`tel:${store.contactPhone}`} className="sp-contact-item">
                  <FiPhone size={14} /> {store.contactPhone}
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── PRODUCTS ── */}
      <section className="sp-products">
        <div className="sp-products__inner">
          <div className="sp-products__header">
            <h2>All Products</h2>
            <span className="sp-products__count">{products.length} items</span>
          </div>

          {products.length === 0 ? (
            <div className="sp-empty">
              <FiPackage size={48} />
              <h3>No products yet</h3>
              <p>This store hasn't added any products.</p>
            </div>
          ) : (
            <div className="sp-grid">
              {products.map((p) => {
                const disc = discount(p);
                const isWished = wishlistIds.includes(p._id);
                const cartQty = cartItems.find((i) => i.productId === p._id)?.quantity || 0;
                const outOfStock = p.stock === 0 || cartQty >= p.stock;

                return (
                  <div key={p._id} className="sp-card">
                    <button
                      className={`sp-card__wish${isWished ? " sp-card__wish--active" : ""}`}
                      onClick={() => handleWishlist(p)}
                      aria-label="Wishlist"
                    >
                      <FiHeart size={15} />
                    </button>

                    <Link to={`/product/${p._id}`} className="sp-card__img-wrap">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="sp-card__img" loading="lazy" />
                        : <div className="sp-card__img-placeholder"><FiShoppingBag size={32} /></div>
                      }
                      {disc > 0 && <span className="sp-card__badge">{disc}% off</span>}
                      {outOfStock && <span className="sp-card__oos">Out of Stock</span>}
                    </Link>

                    <div className="sp-card__body">
                      <Link to={`/product/${p._id}`} className="sp-card__name">{p.name}</Link>
                      <div className="sp-card__rating">
                        {[1,2,3,4,5].map((s) => (
                          <FiStar key={s} size={11} className={s <= 4 ? "sp-star--filled" : "sp-star--empty"} />
                        ))}
                        <span>(4.5)</span>
                      </div>
                      <div className="sp-card__price-row">
                        <span className="sp-card__price">₹{p.price.toLocaleString("en-IN")}</span>
                        {disc > 0 && (
                          <span className="sp-card__compare">₹{p.comparePrice.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                      <button
                        className={`sp-card__cart${outOfStock ? " sp-card__cart--disabled" : ""}`}
                        onClick={() => handleAddToCart(p)}
                        disabled={outOfStock}
                      >
                        <FiShoppingCart size={14} />
                        {outOfStock ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
