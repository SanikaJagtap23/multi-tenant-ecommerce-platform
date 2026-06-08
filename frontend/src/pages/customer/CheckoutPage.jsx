import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCart, groupByStore, calcStoreTotals } from "../../features/cart/cartSlice";
import { clearOrderState } from "../../features/order/orderSlice";
import { fetchAddresses } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import { FiMapPin, FiCreditCard, FiTruck, FiPackage, FiCheck, FiChevronDown } from "react-icons/fi";
import "./CheckoutPage.css";

const STEPS = ["Address", "Payment", "Review"];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, tax, shipping, total } = useSelector((s) => s.cart);
  const { userInfo, addresses } = useSelector((s) => s.auth);

  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({
    fullName: userInfo?.name || "",
    email:    userInfo?.email || "",
    phone:    "",
    street:   "",
    city:     "",
    state:    "",
    postalCode: "",
    country:  "India",
  });

  const storeGroups = Object.values(groupByStore(items));

  useEffect(() => {
    dispatch(clearOrderState());
    dispatch(fetchAddresses());
  }, [dispatch]);

  // Redirect if cart empty
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
    setPlacing(true);

    const failed = [];

    for (const group of storeGroups) {
      try {
        await axiosInstance.post("/orders", {
          items: group.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          storeId: group.storeId,
          shippingAddress: address,
          paymentMethod,
          notes: "",
        });
      } catch (err) {
        failed.push(group.storeName || group.storeId);
      }
    }

    setPlacing(false);

    if (failed.length === 0) {
      dispatch(clearCart());
      toast.success(
        storeGroups.length > 1
          ? `🎉 ${storeGroups.length} orders placed successfully!`
          : "🎉 Order placed successfully!"
      );
      navigate("/my-orders");
    } else {
      toast.error(`Orders failed for: ${failed.join(", ")}. Please try again.`);
    }
  };

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
          {/* Main content */}
          <div className="checkout-main">
            {/* STEP 0 — Address */}
            {step === 0 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiMapPin className="checkout-section-title__icon" /> Shipping Address
                </h2>

                {/* Saved address picker */}
                {addresses && addresses.length > 0 && (
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
                            email:      addr.email   || userInfo?.email || "",
                            phone:      addr.phone   || "",
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
                    { name: "fullName",   label: "Full Name",      placeholder: "John Doe",          col: 2 },
                    { name: "email",      label: "Email",          placeholder: "john@example.com",  type: "email" },
                    { name: "phone",      label: "Phone Number",   placeholder: "+91 9876543210" },
                    { name: "street",     label: "Street Address", placeholder: "123 Main Street",   col: 2 },
                    { name: "city",       label: "City",           placeholder: "Mumbai" },
                    { name: "state",      label: "State",          placeholder: "Maharashtra" },
                    { name: "postalCode", label: "Postal Code",    placeholder: "400001" },
                    { name: "country",    label: "Country",        placeholder: "India" },
                  ].map(({ name, label, placeholder, type = "text", col }) => (
                    <div key={name} className={`checkout-address-field${col === 2 ? " checkout-address-field--full" : ""}`}>
                      <label>
                        {label} <span>*</span>
                      </label>
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

            {/* STEP 1 — Payment */}
            {step === 1 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiCreditCard className="checkout-section-title__icon" /> Payment Method
                </h2>
                <div className="checkout-payment-list">
                  {[
                    {
                      value: "cod",
                      icon: FiTruck,
                      label: "Cash on Delivery",
                      sub: "Pay when your order arrives at your door",
                    },
                    {
                      value: "stripe",
                      icon: FiCreditCard,
                      label: "Pay Online (Stripe)",
                      sub: "Credit / Debit card — 100% secure",
                    },
                  ].map(({ value, icon: Icon, label, sub }) => (
                    <label
                      key={value}
                      className={`checkout-payment-option${paymentMethod === value ? " checkout-payment-option--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={value}
                        checked={paymentMethod === value}
                        onChange={() => setPaymentMethod(value)}
                      />
                      <Icon className="checkout-payment-icon" size={22} />
                      <div>
                        <p className="checkout-payment-label">{label}</p>
                        <p className="checkout-payment-sub">{sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="checkout-actions">
                  <button onClick={() => setStep(0)} className="checkout-actions__back">
                    ← Back
                  </button>
                  <button onClick={() => setStep(2)} className="checkout-actions__next">
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Review */}
            {step === 2 && (
              <div className="checkout-section">
                <h2 className="checkout-section-title">
                  <FiCheck className="checkout-section-title__icon" /> Review Your Order
                </h2>

                {/* Address review */}
                <div className="checkout-review-block">
                  <div className="checkout-review-block__header">
                    <p className="checkout-review-block__label">Delivering to</p>
                    <button onClick={() => setStep(0)} className="checkout-review-block__edit">Edit</button>
                  </div>
                  <p className="checkout-review-block__name">{address.fullName}</p>
                  <p className="checkout-review-block__detail">{address.street}, {address.city}, {address.state} — {address.postalCode}</p>
                  <p className="checkout-review-block__detail">{address.phone}</p>
                </div>

                {/* Payment review */}
                <div className="checkout-review-block">
                  <div className="checkout-review-block__header">
                    <p className="checkout-review-block__label">Payment</p>
                    <button onClick={() => setStep(1)} className="checkout-review-block__edit">Edit</button>
                  </div>
                  <p className="checkout-review-block__payment-val">
                    {paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Stripe (Card)"}
                  </p>
                </div>

                {/* Items grouped by store */}
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
                                {item.image ? (
                                  <img src={item.image} alt={item.name} />
                                ) : (
                                  <div className="checkout-item-image__placeholder">
                                    <FiPackage size={14} />
                                  </div>
                                )}
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
                  <button onClick={() => setStep(1)} disabled={placing} className="checkout-actions__back">
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="checkout-actions__place"
                  >
                    {placing ? <><Spinner size="sm" /> Placing...</> : `Place ${storeGroups.length > 1 ? `${storeGroups.length} Orders` : "Order"}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
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
