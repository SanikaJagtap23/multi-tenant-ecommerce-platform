import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import { FiCheckCircle, FiPackage, FiTruck, FiHome, FiShoppingBag } from "react-icons/fi";
import "./OrderConfirmationPage.css";

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

const statusLabel = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedOrder: order, loading } = useSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  if (loading) return (
    <div className="order-confirm-loading">
      <Spinner size="lg" />
    </div>
  );

  if (!order) return (
    <div className="order-confirm-notfound">
      <p>Order not found.</p>
    </div>
  );

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="order-confirm-page">
      <div className="order-confirm-container">
        {/* Success header */}
        <div className="order-confirm-success">
          <div className="order-confirm-icon-wrap">
            <FiCheckCircle size={40} />
          </div>
          <h1 className="order-confirm-title">Order Placed!</h1>
          <p className="order-confirm-subtitle">
            Thank you for your purchase. Your order has been received.
          </p>
          <div className="order-confirm-id-chip">
            <p className="order-confirm-id-chip__label">Order ID</p>
            <p className="order-confirm-id-chip__value">{order._id}</p>
          </div>
        </div>

        {/* Tracking progress */}
        {!isCancelled && (
          <div className="order-confirm-tracking">
            <h2>Order Status</h2>
            <div className="order-confirm-step-row">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="order-confirm-step">
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <div className="order-confirm-step__col" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div className={`order-confirm-step-dot${i <= stepIndex ? " order-confirm-step-dot--active" : ""}`}>
                        {i < stepIndex ? "✓" : i + 1}
                      </div>
                      <span className={`order-confirm-step-label${i <= stepIndex ? " order-confirm-step-label--active" : ""}`}>
                        {statusLabel[s]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`order-confirm-step-line${i < stepIndex ? " order-confirm-step-line--active" : ""}`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="order-confirm-cancelled-notice">
            This order has been cancelled.
          </div>
        )}

        {/* Order items */}
        <div className="order-confirm-items">
          <h2 className="order-confirm-items__heading">
            <FiPackage className="order-confirm-items__heading-icon" />
            Items Ordered
          </h2>
          <div className="order-confirm-items__list">
            {order.items.map((item, i) => (
              <div key={i} className="order-confirm-item-row">
                <div className="order-confirm-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="order-confirm-item-image__placeholder">
                      <FiPackage />
                    </div>
                  )}
                </div>
                <div className="order-confirm-item-name">
                  <p>{item.name}</p>
                  <p className="order-confirm-item-qty">Qty: {item.quantity}</p>
                </div>
                <span className="order-confirm-item-price">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="order-confirm-totals">
            <div className="order-confirm-totals__row">
              <span>Subtotal</span>
              <span>₹{order.subtotal?.toLocaleString()}</span>
            </div>
            <div className="order-confirm-totals__row">
              <span>GST</span>
              <span>₹{order.tax?.toLocaleString()}</span>
            </div>
            <div className="order-confirm-totals__row">
              <span>Shipping</span>
              <span>{order.shippingCost === 0 ? "FREE" : `₹${order.shippingCost}`}</span>
            </div>
            <div className="order-confirm-totals__grand">
              <span>Total Paid</span>
              <span>₹{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        {order.shippingAddress?.street && (
          <div className="order-confirm-address">
            <h2 className="order-confirm-address__heading">
              <FiTruck className="order-confirm-address__heading-icon" />
              Delivery Address
            </h2>
            <p>{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        )}

        {/* Actions */}
        <div className="order-confirm-actions">
          <Link to="/my-orders" className="order-confirm-actions__orders">
            <FiShoppingBag size={16} />
            My Orders
          </Link>
          <Link to="/" className="order-confirm-actions__shop">
            <FiHome size={16} />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
