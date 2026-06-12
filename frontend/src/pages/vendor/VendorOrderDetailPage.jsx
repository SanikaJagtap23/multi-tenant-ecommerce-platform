import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchVendorOrders, updateOrderStatus } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import {
  FiArrowLeft, FiPackage, FiUser, FiMapPin, FiCreditCard,
  FiMessageSquare, FiClock, FiCheckCircle, FiXCircle,
  FiTruck, FiShoppingBag,
} from "react-icons/fi";
import "./VendorOrderDetailPage.css";

const NEXT_STATUSES = {
  payment_pending: [],
  payment_failed: [],
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped:   ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_META = {
  payment_pending: { label: "Awaiting Payment", cls: "vodp-s--pay-pending", icon: <FiClock /> },
  payment_failed:  { label: "Payment Failed",   cls: "vodp-s--failed",      icon: <FiXCircle /> },
  pending:         { label: "Pending",           cls: "vodp-s--pending",     icon: <FiClock /> },
  confirmed:       { label: "Confirmed",         cls: "vodp-s--confirmed",   icon: <FiCheckCircle /> },
  shipped:         { label: "Shipped",           cls: "vodp-s--shipped",     icon: <FiTruck /> },
  delivered:       { label: "Delivered",         cls: "vodp-s--delivered",   icon: <FiCheckCircle /> },
  cancelled:       { label: "Cancelled",         cls: "vodp-s--cancelled",   icon: <FiXCircle /> },
};

const TIMELINE = ["pending", "confirmed", "shipped", "delivered"];

export default function VendorOrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { vendorOrders, loading } = useSelector((s) => s.order);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    if (vendorOrders.length === 0) {
      dispatch(fetchVendorOrders());
    }
  }, [dispatch, vendorOrders.length]);

  const order = vendorOrders.find((o) => o._id === id);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(newStatus);
    try {
      await dispatch(updateOrderStatus({ id, status: newStatus })).unwrap();
      toast.success(`Order marked as "${newStatus}"`);
    } catch (err) {
      toast.error(err || "Failed to update status.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading && !order) {
    return (
      <div className="vodp-center">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="vodp-not-found">
        <FiPackage size={40} />
        <h2>Order not found</h2>
        <p>This order may have been removed or the ID is incorrect.</p>
        <Link to="/vendor/orders" className="vodp-back-link">
          <FiArrowLeft size={14} /> Back to Orders
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const nextStatuses = NEXT_STATUSES[order.status] || [];
  const timelineStep = TIMELINE.indexOf(order.status);

  return (
    <div className="vodp-page">
      {/* Back + Breadcrumb */}
      <div className="vodp-back">
        <button onClick={() => navigate("/vendor/orders")} className="vodp-back-btn">
          <FiArrowLeft size={15} /> Back to Orders
        </button>
      </div>

      {/* Page Header */}
      <div className="vodp-header">
        <div className="vodp-header__left">
          <h1 className="vodp-header__id">
            Order <span>#{order._id.slice(-8).toUpperCase()}</span>
          </h1>
          <p className="vodp-header__date">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="vodp-header__right">
          <span className={`vodp-status-badge ${meta.cls}`}>
            {meta.icon} {meta.label}
          </span>
        </div>
      </div>

      {/* Status Timeline (for non-cancelled/failed orders) */}
      {!["cancelled", "payment_failed", "payment_pending"].includes(order.status) && (
        <div className="vodp-timeline">
          {TIMELINE.map((step, i) => {
            const isCompleted = i < timelineStep;
            const isCurrent = i === timelineStep;
            return (
              <div key={step} className={`vodp-tl-step${isCompleted ? " vodp-tl-step--done" : ""}${isCurrent ? " vodp-tl-step--current" : ""}`}>
                <div className="vodp-tl-dot">
                  {isCompleted ? <FiCheckCircle size={16} /> : isCurrent ? STATUS_META[step]?.icon : null}
                </div>
                <span className="vodp-tl-label">{STATUS_META[step]?.label}</span>
                {i < TIMELINE.length - 1 && (
                  <div className={`vodp-tl-line${isCompleted ? " vodp-tl-line--done" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status Actions */}
      {nextStatuses.length > 0 && (
        <div className="vodp-actions-bar">
          <span className="vodp-actions-bar__label">Update Status:</span>
          {nextStatuses.map((s) => (
            <button
              key={s}
              disabled={!!updatingStatus}
              onClick={() => handleStatusChange(s)}
              className={`vodp-action-btn${s === "cancelled" ? " vodp-action-btn--cancel" : " vodp-action-btn--advance"}`}
            >
              {updatingStatus === s ? "Updating…" : `Mark as ${s}`}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="vodp-grid">
        {/* LEFT COLUMN */}
        <div className="vodp-col-main">
          {/* Order Items */}
          <div className="vodp-card">
            <div className="vodp-card__header">
              <FiShoppingBag size={16} />
              <h2 className="vodp-card__title">Order Items</h2>
            </div>
            <div className="vodp-items">
              {order.items.map((item, i) => (
                <div key={i} className="vodp-item">
                  <div className="vodp-item__img">
                    {item.image
                      ? <img src={item.image} alt={item.name} />
                      : <FiPackage size={18} />}
                  </div>
                  <div className="vodp-item__info">
                    <p className="vodp-item__name">{item.name}</p>
                    <p className="vodp-item__qty">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                  </div>
                  <p className="vodp-item__total">
                    ₹{((item.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="vodp-items__summary">
              <div className="vodp-items__summary-row">
                <span>Subtotal</span>
                <span>₹{order.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="vodp-items__summary-row vodp-items__summary-row--total">
                <span>Total</span>
                <span>₹{order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.notes && (
            <div className="vodp-card">
              <div className="vodp-card__header">
                <FiMessageSquare size={16} />
                <h2 className="vodp-card__title">Customer Note</h2>
              </div>
              <p className="vodp-notes">{order.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="vodp-col-side">
          {/* Customer Info */}
          <div className="vodp-card">
            <div className="vodp-card__header">
              <FiUser size={16} />
              <h2 className="vodp-card__title">Customer</h2>
            </div>
            <div className="vodp-info-group">
              <div className="vodp-customer-avatar">
                {order.customer?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="vodp-info__name">{order.customer?.name || "—"}</p>
                <p className="vodp-info__secondary">{order.customer?.email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress?.street && (
            <div className="vodp-card">
              <div className="vodp-card__header">
                <FiMapPin size={16} />
                <h2 className="vodp-card__title">Delivery Address</h2>
              </div>
              <div className="vodp-address">
                <p className="vodp-address__name">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                </p>
                {order.shippingAddress.phone && (
                  <p className="vodp-address__phone">{order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="vodp-card">
            <div className="vodp-card__header">
              <FiCreditCard size={16} />
              <h2 className="vodp-card__title">Payment</h2>
            </div>
            <div className="vodp-payment">
              <div className="vodp-payment__row">
                <span className="vodp-payment__label">Method</span>
                <span className="vodp-payment__value">
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod?.toUpperCase() || "—"}
                </span>
              </div>
              <div className="vodp-payment__row">
                <span className="vodp-payment__label">Status</span>
                <span className={`vodp-payment__status ${
                  order.paymentStatus === "paid" ? "vodp-payment__status--paid"
                  : order.paymentStatus === "failed" ? "vodp-payment__status--failed"
                  : "vodp-payment__status--pending"
                }`}>
                  {order.paymentStatus === "paid" ? "Paid"
                    : order.paymentStatus === "failed" ? "Failed"
                    : "Pending"}
                </span>
              </div>
              <div className="vodp-payment__row vodp-payment__row--total">
                <span className="vodp-payment__label">Total Amount</span>
                <span className="vodp-payment__amount">₹{order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
