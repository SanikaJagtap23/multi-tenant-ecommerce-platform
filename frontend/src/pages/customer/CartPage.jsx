import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { removeFromCart, updateQuantity, clearCart, groupByStore, calcStoreTotals } from "../../features/cart/cartSlice";
import { FiShoppingCart, FiTrash2, FiArrowLeft, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import "./CartPage.css";

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, tax, shipping, total } = useSelector((s) => s.cart);

  const storeGroups = Object.values(groupByStore(items));

  const handleQty = (productId, qty) => dispatch(updateQuantity({ productId, quantity: qty }));

  const handleRemove = (productId, name) => {
    dispatch(removeFromCart(productId));
    toast.success(`${name} removed.`);
  };

  const handleClear = () => {
    if (window.confirm("Clear your entire cart?")) {
      dispatch(clearCart());
      toast.success("Cart cleared.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <FiShoppingCart className="cart-empty__icon" size={80} />
        <div className="cart-empty__text">
          <h2 className="cart-empty__title">Your cart is empty</h2>
          <p className="cart-empty__desc">Looks like you haven't added anything yet.</p>
          <Link to="/" className="btn btn-primary">
            <FiArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <h1 className="cart-title">
            Shopping Cart
            <span className="cart-title__meta">
              ({items.length} item{items.length !== 1 ? "s" : ""} from {storeGroups.length} store{storeGroups.length !== 1 ? "s" : ""})
            </span>
          </h1>
          <button onClick={handleClear} className="cart-clear-btn">
            <FiTrash2 size={14} /> Clear all
          </button>
        </div>

        <div className="cart-layout">
          {/* Cart items — grouped by store */}
          <div className="cart-items-col">
            {storeGroups.map((group) => {
              const storeTotals = calcStoreTotals(group.items);
              return (
                <div key={group.storeId} className="cart-store-group">
                  {/* Store header */}
                  <div className="cart-store-header">
                    <div className="cart-store-header__left">
                      <div className="cart-store-icon">
                        <FiPackage size={14} />
                      </div>
                      <span className="cart-store-name">{group.storeName || "Store"}</span>
                    </div>
                    <span className="cart-store-meta">
                      {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                      {" · "}
                      {storeTotals.shipping === 0
                        ? <span className="cart-store-meta__free">Free delivery</span>
                        : <span>₹{storeTotals.shipping} delivery</span>
                      }
                    </span>
                  </div>

                  {/* Items */}
                  <ul className="cart-items-list">
                    {group.items.map((item) => (
                      <li key={item.productId} className="cart-item">
                        {/* Image */}
                        <Link to={`/product/${item.productId}`} className="cart-item__image-link">
                          <div className="cart-item__image">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <div className="cart-item__image-placeholder">
                                <FiPackage size={24} />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="cart-item__details">
                          <Link to={`/product/${item.productId}`} className="cart-item__name">
                            {item.name}
                          </Link>
                          <p className="cart-item__unit-price">₹{item.price.toLocaleString()} each</p>

                          <div className="cart-item__controls">
                            {/* Qty */}
                            <div className="cart-qty">
                              <button
                                onClick={() => handleQty(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="cart-qty__btn"
                              >
                                −
                              </button>
                              <span className="cart-qty__value">{item.quantity}</span>
                              <button
                                onClick={() => handleQty(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="cart-qty__btn"
                              >
                                +
                              </button>
                            </div>

                            <div className="cart-item__right">
                              <span className="cart-item__total">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleRemove(item.productId, item.name)}
                                className="cart-item__remove-btn"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {item.quantity >= item.stock && (
                            <p className="cart-item__stock-warn">Maximum stock reached</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Per-store subtotal */}
                  <div className="cart-store-subtotal">
                    <span className="cart-store-subtotal__label">
                      Store subtotal ({group.items.reduce((s, i) => s + i.quantity, 0)} units)
                    </span>
                    <span className="cart-store-subtotal__value">₹{storeTotals.subtotal.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="cart-summary-col">
            <div className="cart-summary">
              <h2 className="cart-summary__title">Order Summary</h2>

              {/* Per-store breakdown */}
              {storeGroups.length > 1 && (
                <div className="cart-summary__breakdown">
                  {storeGroups.map((g) => {
                    const t = calcStoreTotals(g.items);
                    return (
                      <div key={g.storeId} className="cart-summary__breakdown-row">
                        <span>
                          <FiPackage size={11} /> {g.storeName || "Store"}
                        </span>
                        <span>₹{t.subtotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="cart-summary__row">
                  <span>GST (10%)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <div className={`cart-summary__row${shipping === 0 ? " cart-summary__row--free" : ""}`}>
                  <span>Delivery</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="cart-summary__note">
                    Delivery charges apply per store (₹49 if store order &lt; ₹500)
                  </p>
                )}
                <div className="cart-summary__total">
                  <span>Grand Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={() => navigate("/checkout")} className="cart-summary__checkout-btn">
                Proceed to Checkout →
              </button>

              <Link to="/" className="cart-summary__continue-link">
                <FiArrowLeft size={14} /> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
