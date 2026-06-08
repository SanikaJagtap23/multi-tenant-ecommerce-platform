import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchAllProducts } from "../../features/product/productSlice";
import { fetchAllStores } from "../../features/store/storeSlice";
import { addToCart } from "../../features/cart/cartSlice";
import Spinner from "../../components/common/Spinner";
import { ProductCardSkeleton } from "../../components/common/Skeletons";
import toast from "react-hot-toast";
import {
  FiShoppingBag, FiArrowRight, FiPackage, FiStar,
  FiShoppingCart, FiTrendingUp, FiAward, FiZap,
  FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiHeart,
} from "react-icons/fi";
import { fetchWishlist, toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { openAuthModal } from "../../features/auth/authSlice";
import "./HomePage.css";

// Category config with emoji + gradient colors
const CATEGORIES = [
  { label: "Electronics",          value: "Electronics",            emoji: "📱", gradFrom: "#3b82f6", gradTo: "#06b6d4" },
  { label: "Fashion",              value: "Fashion",                emoji: "👗", gradFrom: "#ec4899", gradTo: "#fb7185" },
  { label: "Home & Living",        value: "Home & Living",          emoji: "🏡", gradFrom: "#22c55e", gradTo: "#2dd4bf" },
  { label: "Sports & Fitness",     value: "Sports & Fitness",       emoji: "⚽", gradFrom: "#f97316", gradTo: "#fbbf24" },
  { label: "Books",                value: "Books",                  emoji: "📚", gradFrom: "#f59e0b", gradTo: "#facc15" },
  { label: "Beauty & Personal Care", value: "Beauty & Personal Care", emoji: "💄", gradFrom: "#f43f5e", gradTo: "#f472b6" },
  { label: "Toys & Games",         value: "Toys & Games",           emoji: "🎮", gradFrom: "#a855f7", gradTo: "#818cf8" },
  { label: "Food",                 value: "Food & Beverages",       emoji: "🍕", gradFrom: "#ef4444", gradTo: "#f97316" },
];

const FEATURES = [
  { icon: FiTruck,      label: "Free Delivery",      sub: "On orders above ₹500",    colorClass: "feature-icon--blue" },
  { icon: FiShield,     label: "Secure Payments",    sub: "100% buyer protection",   colorClass: "feature-icon--green" },
  { icon: FiRefreshCw,  label: "Easy Returns",       sub: "7-day hassle-free return", colorClass: "feature-icon--orange" },
  { icon: FiHeadphones, label: "24/7 Support",       sub: "Dedicated customer care",  colorClass: "feature-icon--purple" },
];

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

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { userInfo } = useSelector((s) => s.auth);
  const { products, loading } = useSelector((s) => s.product);
  const { stores } = useSelector((s) => s.store);
  const { items: cartItems } = useSelector((s) => s.cart);
  const { ids: wishlistIds } = useSelector((s) => s.wishlist);

  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "");
  const [hovered, setHovered] = useState(null);

  // Load wishlist when customer is logged in
  useEffect(() => {
    if (userInfo?.role === "customer") dispatch(fetchWishlist());
  }, [userInfo]);

  const handleToggleWishlist = async (e, product) => {
    e.preventDefault();
    if (!userInfo) { dispatch(openAuthModal("customer")); return; }
    if (userInfo.role !== "customer") { toast.error("Only customers can use the wishlist."); return; }
    const result = await dispatch(toggleWishlist(product._id));
    if (toggleWishlist.fulfilled.match(result)) {
      const added = result.payload.wishlisted;
      toast.success(added ? `${product.name} added to wishlist!` : `${product.name} removed from wishlist`);
      dispatch(fetchWishlist());
    }
  };

  // Sync URL params → filter
  useEffect(() => {
    const cat = searchParams.get("category") || "";
    const q   = searchParams.get("search")   || "";
    setActiveCategory(cat);
    dispatch(fetchAllProducts({ search: q, category: cat }));
    dispatch(fetchAllStores());
  }, [dispatch, searchParams]);

  const handleCategoryClick = (val) => {
    setActiveCategory(val);
    navigate(val ? `/?category=${encodeURIComponent(val)}` : "/");
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    if (!userInfo) { dispatch(openAuthModal("customer")); return; }
    if (userInfo.role !== "customer") { toast.error("Only customers can shop."); return; }
    if (product.stock === 0) return;

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

  const searchQ = searchParams.get("search") || "";
  const filtered = products.filter((p) => {
    const matchSearch = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  // One representative product per category (highest discount), used for All-mode rotation
  const heroByCategory = useMemo(() => {
    return CATEGORIES
      .map(({ value }) => {
        const pool = products.filter(p => p.category === value);
        return [...pool].sort((a, b) => (b.comparePrice - b.price) - (a.comparePrice - a.price))[0];
      })
      .filter(Boolean);
  }, [products]);

  // Auto-rotate hero cards every 3 s when no category is selected
  const [heroOffset, setHeroOffset] = useState(0);
  useEffect(() => {
    if (activeCategory || heroByCategory.length < 2) return;
    const id = setInterval(() => {
      setHeroOffset(o => (o + 1) % heroByCategory.length);
    }, 3000);
    return () => clearInterval(id);
  }, [activeCategory, heroByCategory.length]);

  // Reset offset when category changes
  useEffect(() => { setHeroOffset(0); }, [activeCategory]);

  const topProducts = useMemo(() => {
    if (activeCategory) {
      return [...products.filter(p => p.category === activeCategory)]
        .sort((a, b) => (b.comparePrice - b.price) - (a.comparePrice - a.price))
        .slice(0, 4);
    }
    if (heroByCategory.length === 0) return [];
    // Sliding window of 4 across all category reps
    return [0, 1, 2, 3].map(i => heroByCategory[(heroOffset + i) % heroByCategory.length]);
  }, [activeCategory, products, heroByCategory, heroOffset]);

  return (
    <div className="home-page">

      {/* ══════════ HERO BANNER ══════════ */}
      <section className="hero">
        <div className="hero__bg-deco" />

        <div className="hero__inner">
          <div className="hero__content">

            {/* Left — text */}
            <div className="hero__text">
              <div className="hero__badge">
                <FiZap size={12} className="hero__badge-zap" />
                India's Fastest Growing Marketplace
              </div>
              <h1 className="hero__title">
                Shop Smarter,{" "}
                <span className="hero__title-highlight">
                  <span>Save Bigger</span>
                  <span className="hero__title-highlight-line" />
                </span>
              </h1>
              <p className="hero__desc">
                Discover thousands of products from verified local vendors. Quality products, unbeatable prices, fast delivery.
              </p>

              <div className="hero__actions">
                <a href="#products" className="hero__btn-primary">
                  <FiShoppingBag size={18} />
                  Shop Now
                </a>
                {!userInfo && (
                  <button className="hero__btn-outline" onClick={() => dispatch(openAuthModal("vendor"))}>
                    🏪 Sell with us <FiArrowRight size={15} />
                  </button>
                )}
              </div>

              {/* Mini stats */}
              <div className="hero__stats">
                {[
                  { val: `${stores.length}+`,    lbl: "Stores" },
                  { val: `${products.length}+`,  lbl: "Products" },
                  { val: "100%",                 lbl: "Secure" },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="hero__stat">
                    <p className="hero__stat-value">{val}</p>
                    <p className="hero__stat-label">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating product cards preview */}
            <div className="hero__preview">
              {topProducts.slice(0, 4).map((p, i) => (
                <Link
                  key={`${p._id}-${heroOffset}-${i}`}
                  to={`/product/${p._id}`}
                  className={`hero__preview-card${i === 1 ? " hero__preview-card--offset-down" : ""}${i === 3 ? " hero__preview-card--offset-up" : ""}`}
                >
                  <div className="hero__preview-aspect">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} />
                    ) : (
                      <div className="hero__preview-placeholder">
                        <FiPackage size={28} />
                      </div>
                    )}
                  </div>
                  <div className="hero__preview-body">
                    <p className="hero__preview-name">{p.name}</p>
                    <p className="hero__preview-price">₹{p.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              {topProducts.length < 4 && [...Array(4 - topProducts.length)].map((_, i) => (
                <div
                  key={i}
                  className={`hero__preview-placeholder-card${i === 0 && topProducts.length === 1 ? " hero__preview-placeholder-card--offset" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES STRIP ══════════ */}
      <section className="features-strip">
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, label, sub, colorClass }) => (
            <div key={label} className="feature-item">
              <div className={`feature-icon ${colorClass}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="feature-title">{label}</p>
                <p className="feature-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CATEGORIES ══════════ */}
      <section className="categories-section">
        <div className="categories-header">
          <h2>Shop by Category</h2>
          <button onClick={() => handleCategoryClick("")} className="categories-header__view-all">
            View all <FiArrowRight size={14} />
          </button>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map(({ label, value, emoji, gradFrom, gradTo }) => (
            <button
              key={value}
              onClick={() => handleCategoryClick(value)}
              className={`category-btn${activeCategory === value ? " category-btn--active" : ""}`}
              style={
                activeCategory === value
                  ? { background: `linear-gradient(to bottom right, ${gradFrom}, ${gradTo})` }
                  : {}
              }
            >
              <span className="category-btn__emoji">{emoji}</span>
              <span className="category-btn__label">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════ PROMO BANNERS ══════════ */}
      <section className="promo-banners">
        <div className="promo-grid">
          {/* Banner 1 — Flash Sale */}
          <div className="promo-card promo-card--flash">
            <div className="promo-card__deco-1" />
            <div className="promo-card__deco-2" />
            <div className="promo-card__content">
              <div className="promo-card__tag">⚡ Flash Sale</div>
              <h3 className="promo-card__title">Up to 50% Off</h3>
              <p className="promo-card__desc">On electronics &amp; gadgets</p>
              <button onClick={() => handleCategoryClick("Electronics")} className="promo-card__btn">
                Shop Now <FiArrowRight size={12} />
              </button>
            </div>
            <div className="promo-card__emoji">📱</div>
          </div>

          {/* Banner 2 — Fashion */}
          <div className="promo-card promo-card--fashion">
            <div className="promo-card__deco-1" />
            <div className="promo-card__deco-2" />
            <div className="promo-card__content">
              <div className="promo-card__tag">👗 New Arrivals</div>
              <h3 className="promo-card__title">Trending Fashion</h3>
              <p className="promo-card__desc">Latest styles from top vendors</p>
              <button onClick={() => handleCategoryClick("Fashion")} className="promo-card__btn">
                Explore <FiArrowRight size={12} />
              </button>
            </div>
            <div className="promo-card__emoji">👗</div>
          </div>
        </div>
      </section>

      {/* ══════════ PRODUCTS SECTION ══════════ */}
      <section id="products" className="products-section">
        <div className="products-header">
          <div className="products-header__left">
            <h2>
              {activeCategory ? (
                <>
                  {CATEGORIES.find((c) => c.value === activeCategory)?.emoji}{" "}
                  {CATEGORIES.find((c) => c.value === activeCategory)?.label || activeCategory}
                </>
              ) : (
                <><FiTrendingUp className="products-section-icon" /> All Products</>
              )}
            </h2>
            {!loading && (
              <p className="products-header__count">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
          {activeCategory && (
            <button onClick={() => handleCategoryClick("")} className="products-header__clear-btn">
              Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="products-grid">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="products-empty">
            <div className="products-empty__icon">🔍</div>
            <p className="products-empty__title">No products found</p>
            <p className="products-empty__desc">Try a different category or search term.</p>
            <button onClick={() => handleCategoryClick("")} className="products-empty__btn">
              <FiShoppingBag size={15} /> Browse All
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((product) => {
              const discount = product.comparePrice > product.price
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0;
              return (
                <div
                  key={product._id}
                  className="product-card"
                  onMouseEnter={() => setHovered(product._id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Image */}
                  <Link to={`/product/${product._id}`} className="product-card__image-link">
                    <div className="product-card__image-wrap">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="product-card__image"
                        />
                      ) : (
                        <div className="product-card__image-placeholder">
                          <FiPackage />
                        </div>
                      )}

                      {/* Badges */}
                      {discount > 0 && (
                        <div className="product-card__badge-discount">-{discount}%</div>
                      )}
                      {product.stock === 0 && (
                        <div className="product-card__badge-stock">
                          <span>Out of Stock</span>
                        </div>
                      )}
                      {product.stock > 0 && product.stock < 5 && (
                        <div className="product-card__badge-low">Only {product.stock} left</div>
                      )}

                      {/* Wishlist heart button */}
                      <button
                        className={`heart-btn ${wishlistIds.includes(product._id) ? "heart-btn--active" : ""}`}
                        onClick={(e) => handleToggleWishlist(e, product)}
                        title={wishlistIds.includes(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <FiHeart size={14} />
                      </button>

                      {/* Hover add to cart overlay */}
                      {product.stock > 0 && hovered === product._id && (
                        <div className="product-card__add-overlay">
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="product-card__add-btn"
                          >
                            <FiShoppingCart size={13} />
                            Add to Cart
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="product-card__info">
                    <p className="product-card__category">{product.category}</p>
                    <Link to={`/product/${product._id}`} className="product-card__name">
                      {product.name}
                    </Link>

                    {/* Star rating placeholder */}
                    <div className="product-card__stars">
                      {[1,2,3,4,5].map((s) => (
                        <FiStar key={s} size={10} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                      ))}
                      <span className="product-card__stars-count">(4.5)</span>
                    </div>

                    <div className="product-card__pricing">
                      <div>
                        <span className="product-card__price">₹{product.price.toLocaleString()}</span>
                        {product.comparePrice > product.price && (
                          <span className="product-card__compare">
                            ₹{product.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {discount > 0 && (
                        <span className="product-card__discount">{discount}% off</span>
                      )}
                    </div>

                    {product.store?.name && (
                      <p className="product-card__store">by {product.store.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════ FEATURED STORES ══════════ */}
      {stores.length > 0 && (
        <section className="stores-section">
          <div className="stores-section__header">
            <h2>
              <FiAward className="stores-award-icon" /> Featured Stores
            </h2>
          </div>
          <div className="stores-grid">
            {stores.slice(0, 8).map((store, i) => {
              const [from, to] = STORE_GRADIENTS[i % STORE_GRADIENTS.length];
              const gradient = `linear-gradient(to right, ${from}, ${to})`;
              const gradientBr = `linear-gradient(to bottom right, ${from}, ${to})`;
              return (
                <Link key={store._id} to={`/?store=${store._id}`} className="store-card">
                  <div className="store-card__accent" style={{ background: gradient }} />
                  <div className="store-card__body">
                    <div className="store-card__logo" style={{ background: gradientBr }}>
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} />
                      ) : (
                        store.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="store-card__info">
                      <p className="store-card__name">{store.name}</p>
                      <p className="store-card__category">{store.category}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════ VENDOR CTA ══════════ */}
      <section className="vendor-cta">
        <div className="vendor-cta__card">
          <div className="vendor-cta__deco" />
          <div className="vendor-cta__inner">
            <div>
              <div className="vendor-cta__emoji">🏪</div>
              <h2 className="vendor-cta__title">Start Selling Today</h2>
              <p className="vendor-cta__desc">
                Join thousands of vendors already selling on Tradezy. Create your store, list products, and start earning — completely free.
              </p>
            </div>
            <div className="vendor-cta__actions">
              <button className="vendor-cta__btn-primary" onClick={() => dispatch(openAuthModal("vendor"))}>
                Create Free Store <FiArrowRight size={16} />
              </button>
              <button className="vendor-cta__btn-outline" onClick={() => dispatch(openAuthModal("vendor"))}>
                Vendor Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <div className="site-footer__logo">
              <FiShoppingBag size={15} />
            </div>
            <span className="site-footer__wordmark">Trade<span>zy</span></span>
          </div>
          <p className="site-footer__copy">© 2026 Tradezy. India's Multi-Vendor Marketplace.</p>
          <div className="site-footer__links">
            <button onClick={() => dispatch(openAuthModal("vendor"))}>Sell on Tradezy</button>
            <span className="site-footer__dot">·</span>
            <button onClick={() => dispatch(openAuthModal("customer"))}>Sign In</button>
            <span className="site-footer__dot">·</span>
            <button onClick={() => dispatch(openAuthModal("customer"))}>Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
