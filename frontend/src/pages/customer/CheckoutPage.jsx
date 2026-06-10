import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart, groupByStore, calcStoreTotals } from "../../features/cart/cartSlice";
import { clearOrderState } from "../../features/order/orderSlice";
import { createPaymentIntent } from "../../features/payment/paymentSlice";
import { fetchAddresses } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import {
  FiMapPin, FiCreditCard, FiTruck, FiPackage, FiCheck,
  FiChevronDown, FiSmartphone, FiDatabase, FiGlobe,
} from "react-icons/fi";
import "./CheckoutPage.css";

const STEPS = ["Address", "Payment", "Review"];

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    sub: "Pay when your order arrives",
    icon: FiTruck,
    badge: null,
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    sub: "Visa, Mastercard, RuPay",
    icon: FiCreditCard,
    badge: "Secure",
  },
  {
    id: "upi",
    label: "UPI",
    sub: "GPay, PhonePe, Paytm, BHIM",
    icon: FiSmartphone,
    badge: "Instant",
  },
  {
    id: "netbanking",
    label: "Net Banking",
    sub: "All major banks supported",
    icon: FiDatabase,
    badge: null,
  },
  {
    id: "wallet",
    label: "Wallet",
    sub: "Paytm, Amazon Pay, Mobikwik",
    icon: FiGlobe,
    badge: null,
  },
];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, tax, shipping, total } = useSelector((s) => s.cart);
  const { userInfo, addresses } = useSelector((s) => s.auth);
  const { loading: paymentLoading } = useSelector((s) => s.payment);

  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({
    fullName:   userInfo?.name  || "",
    email:      userInfo?.email || "",
    phone:      "",
    street:     "",
    city:       "",
    state:      "",
    postalCode: "",
    country:    "India",
  });

  const storeGroups = Object.values(groupByStore(items));

  useEffect(() => {
    dispatch(clearOrderState());
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items, navigate]);

  const handleAddressChange = (e) =>
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validateAddress = () => {
    const required = ["fullName", "email", "phone", "street", "city", "state", "postalCode"];
    for (const f of required) {
      if (!address[f]?.trim()) {
        toast.error(`Please fill in: ${f.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) { setStep(0); return; }

    const missingStore = storeGroups.some((g) => !g.storeId);
    if (missingStore) {
      toast.error("Some cart items are missing store info. Please remove and re-add them.");
      return;
    }

    setPlacing(true);

    // ── COD flow ──────────────────────────────────────────────────────────────
    if (paymentMethod === "cod") {
      const failed = [];
      for (const group of storeGroups) {
        try {
          await axiosInstance.post("/orders", {
            items: group.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            storeId: group.storeId,
            shippingAddress: address,
            paymentMethod: "cod",
            notes: "",
          });
        } catch {
          failed.push(group.storeName || group.storeId);
        }
      }

      setPlacing(false);

      if (failed.length === 0) {
        dispatch(clearCart());
        toast.success("Order placed successfully!");
        navigate("/my-orders");
      } else {
        toast.error(`Orders failed for: ${failed.join(", ")}. Please try again.`);
      }
      return;
    }

    // ── Online payment flow ───────────────────────────────────────────────────
    try {
      const result = await dispatch(
        createPaymentIntent({
          storeGroups: storeGroups.map((g) => ({
            storeId: g.storeId,
            items: g.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          })),
          shippingAddress: address,
          paymentMethod,
        })
      ).unwrap();

      navigate("/payment", {
        state: {
          intentId:     result.intentId,
          total:        result.total,
          paymentMethod,
        },
      });
    } catch (err) {
      toast.error(err || "Failed to initialise payment. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const isBusy = placing || paymentLoading;
  const stepIcons = [FiMapPin, FiCreditCard, FiCheck];

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        {/* Stepper */}
        <div className="checkout-stepper">
          {STEPS.map((s, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={s} className="checkout-step">
                <div className="checkout-step__inner">
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={`checkout-step-dot${i <= step ? " checkout-step-dot--active" : ""}`}
                  >
                    {i < step ? <FiCheck size={16} /> : <Icon size={16} />}
                  </button>
                  <span className={`checkout-step-label${i <= step ? " checkout-step-label--active" : ""}`}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`checkout-step-line${i < step ? " checkout-step-line--active" : ""}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">

            {/* ── STEP 0: Address ─────────────────────────────────────────── */}
            {step === 0 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiMapPin className="checkout-section-title__icon" /> Shipping Address
                </h2>

                {addresses?.length > 0 && (
                  <div className="checkout-saved-addrs">
                    <p className="checkout-saved-addrs__label">
                      <FiChevronDown size={13} /> Use a saved address
                    </p>
                    <div className="checkout-saved-addrs__list">
                      {addresses.map((addr) => (
                        <button
                          key={addr._id}
                          type="button"
                          className="checkout-saved-addr-btn"
                          onClick={() => setAddress({
                            fullName:   addr.fullName,
                            email:      addr.email || userInfo?.email || "",
                            phone:      addr.phone || "",
                            street:     addr.street,
                            city:       addr.city,
                            state:      addr.state,
                            postalCode: addr.postalCode,
                            country:    addr.country || "India",
                          })}
                        >
                          <span className="checkout-saved-addr-btn__label">{addr.label}</span>
                          <span className="checkout-saved-addr-btn__detail">{addr.fullName} · {addr.city}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="checkout-address-grid">
                  {[
                    { name: "fullName",   label: "Full Name",      placeholder: "Full name",     col: 2 },
                    { name: "email",      label: "Email",          placeholder: "Email address", type: "email" },
                    { name: "phone",      label: "Phone Number",   placeholder: "Phone number" },
                    { name: "street",     label: "Street Address", placeholder: "Street address", col: 2 },
                    { name: "city",       label: "City",           placeholder: "City" },
                    { name: "state",      label: "State",          placeholder: "State" },
                    { name: "postalCode", label: "Postal Code",    placeholder: "PIN code" },
                    { name: "country",    label: "Country",        placeholder: "Country" },
                  ].map(({ name, label, placeholder, type = "text", col }) => (
                    <div key={name} className={`checkout-address-field${col === 2 ? " checkout-address-field--full" : ""}`}>
                      <label>{label} <span>*</span></label>
                      <input
                        type={type}
                        name={name}
                        value={address[name]}
                        onChange={handleAddressChange}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>

                <div className="checkout-actions">
                  <button
                    onClick={() => validateAddress() && setStep(1)}
                    className="checkout-actions__next"
                    style={{ flex: "0 0 100%" }}
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 1: Payment ─────────────────────────────────────────── */}
            {step === 1 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiCreditCard className="checkout-section-title__icon" /> Payment Method
                </h2>

                <div className="checkout-payment-grid">
                  {PAYMENT_METHODS.map(({ id, label, sub, icon: Icon, badge }) => (
                    <label
                      key={id}
                      className={`checkout-pay-option${paymentMethod === id ? " checkout-pay-option--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={id}
                        checked={paymentMethod === id}
                        onChange={() => setPaymentMethod(id)}
                      />
                      <div className="checkout-pay-option__icon-wrap">
                        <Icon size={22} />
                      </div>
                      <div className="checkout-pay-option__body">
                        <span className="checkout-pay-option__label">
                          {label}
                          {badge && <span className="checkout-pay-option__badge">{badge}</span>}
                        </span>
                        <span className="checkout-pay-option__sub">{sub}</span>
                      </div>
                      <div className={`checkout-pay-option__dot${paymentMethod === id ? " checkout-pay-option__dot--on" : ""}`} />
                    </label>
                  ))}
                </div>

                {paymentMethod !== "cod" && (
                  <p className="checkout-pay-stripe-note">
                    🔒 Powered by Stripe — your card/UPI details are never stored on our servers.
                  </p>
                )}

                <div className="checkout-actions">
                  <button onClick={() => setStep(0)} className="checkout-actions__back">← Back</button>
                  <button onClick={() => setStep(2)} className="checkout-actions__next">Review Order →</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Review ──────────────────────────────────────────── */}
            {step === 2 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiCheck className="checkout-section-title__icon" /> Review Your Order
                </h2>

                <div className="checkout-review-block">
                  <div className="checkout-review-block__header">
                    <p className="checkout-review-block__label">Delivering to</p>
                    <button onClick={() => setStep(0)} className="checkout-review-block__edit">Edit</button>
                  </div>
                  <p className="checkout-review-block__name">{address.fullName}</p>
                  <p className="checkout-review-block__detail">{address.street}, {address.city}, {address.state} — {address.postalCode}</p>
                  <p className="checkout-review-block__detail">{address.phone}</p>
                </div>

                <div className="checkout-review-block">
                  <div className="checkout-review-block__header">
                    <p className="checkout-review-block__label">Payment</p>
                    <button onClick={() => setStep(1)} className="checkout-review-block__edit">Edit</button>
                  </div>
                  <p className="checkout-review-block__payment-val">
                    {paymentMethod === "cod"        && "💵 Cash on Delivery"}
                    {paymentMethod === "card"       && "💳 Credit / Debit Card"}
                    {paymentMethod === "upi"        && "📱 UPI"}
                    {paymentMethod === "netbanking" && "🏦 Net Banking"}
                    {paymentMethod === "wallet"     && "👛 Wallet"}
                  </p>
                </div>

                <div className="checkout-review-section">
                  {storeGroups.map((group) => {
                    const t = calcStoreTotals(group.items);
                    return (
                      <div key={group.storeId} className="checkout-store-group">
                        <div className="checkout-store-header">
                          <FiPackage className="checkout-store-header__icon" size={14} />
                          <span className="checkout-store-header__name">{group.storeName || "Store"}</span>
                          <span className="checkout-store-header__delivery">
                            {t.shipping === 0 ? "Free delivery" : `+ ₹${t.shipping} delivery`}
                          </span>
                        </div>
                        <ul className="checkout-items-list">
                          {group.items.map((item) => (
                            <li key={item.productId} className="checkout-item-row">
                              <div className="checkout-item-image">
                                {item.image
                                  ? <img src={item.image} alt={item.name} />
                                  : <div className="checkout-item-image__placeholder"><FiPackage size={14} /></div>
                                }
                              </div>
                              <div className="checkout-item-info">
                                <p className="checkout-item-info__name">{item.name}</p>
                                <p className="checkout-item-info__qty">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                              </div>
                              <span className="checkout-item-price">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="checkout-store-footer">
                          <span>Subtotal + tax + delivery</span>
                          <span className="checkout-store-footer__total">₹{t.total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="checkout-actions">
                  <button onClick={() => setStep(1)} disabled={isBusy} className="checkout-actions__back">
                    ← Back
                  </button>
                  <button onClick={handlePlaceOrder} disabled={isBusy} className="checkout-actions__place">
                    {isBusy
                      ? <><Spinner size="sm" /> {paymentMethod === "cod" ? "Placing..." : "Preparing..."}</>
                      : paymentMethod === "cod"
                        ? `Place ${storeGroups.length > 1 ? `${storeGroups.length} Orders` : "Order"}`
                        : `Proceed to Pay ₹${total.toLocaleString()}`
                    }
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="checkout-sidebar">
            <div className="checkout-sidebar__card">
              <h3 className="checkout-sidebar__title">Price Details</h3>

              {storeGroups.length > 1 && (
                <div className="checkout-sidebar__breakdown">
                  {storeGroups.map((g) => {
                    const t = calcStoreTotals(g.items);
                    return (
                      <div key={g.storeId} className="checkout-sidebar__breakdown-row">
                        <span>{g.storeName || "Store"}</span>
                        <span>₹{t.subtotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="checkout-sidebar__rows">
                <div className="checkout-sidebar__row">
                  <span>Price ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="checkout-sidebar__row">
                  <span>GST (10%)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <div className={`checkout-sidebar__row${shipping === 0 ? " checkout-sidebar__row--free" : ""}`}>
                  <span>Delivery{storeGroups.length > 1 ? ` (${storeGroups.length} stores)` : ""}</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                <div className="checkout-sidebar__total">
                  <span>Grand Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {storeGroups.length > 1 && (
                <p className="checkout-sidebar__note">
                  📦 {storeGroups.length} separate orders will be created
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
