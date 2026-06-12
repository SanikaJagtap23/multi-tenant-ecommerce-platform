import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchVendorOrders, updateOrderStatus } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import { FiPackage, FiUser, FiExternalLink, FiFilter } from "react-icons/fi";
import "./VendorOrdersPage.css";

const NEXT_STATUSES = {
  payment_pending: [],
  payment_failed: [],
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped:   ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS = {
  all: "All",
  payment_pending: "Awaiting Payment",
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Failed",
};

export default function VendorOrdersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { vendorOrders, loading } = useSelector((s) => s.order);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    dispatch(fetchVendorOrders());
  }, [dispatch]);

  const filtered = filter === "all"
    ? vendorOrders
    : vendorOrders.filter((o) => o.status === filter);

  const handleStatusChange = async (e, orderId, newStatus) => {
    e.stopPropagation();
    setUpdatingId(orderId);
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      toast.success(`Marked as "${newStatus}"`);
    } catch (err) {
      toast.error(err || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const paymentLabel = (order) => {
    if (order.paymentStatus === "paid") return { text: `Paid · ${order.paymentMethod?.toUpperCase()}`, cls: "vop-pay--paid" };
    if (order.paymentStatus === "failed") return { text: "Payment failed", cls: "vop-pay--failed" };
    if (order.paymentMethod === "cod") return { text: "COD · Pending", cls: "vop-pay--cod" };
    return { text: "Awaiting payment", cls: "vop-pay--cod" };
  };

  return (
    <div className="vop-page">
      {/* Header */}
      <div className="vop-header">
        <div>
          <h1 className="vop-title">Orders</h1>
          <p className="vop-subtitle">{vendorOrders.length} total orders</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="vop-filters">
        <FiFilter size={14} className="vop-filters__icon" />
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const count = key === "all" ? vendorOrders.length : vendorOrders.filter((o) => o.status === key).length;
          if (key !== "all" && count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`vop-filter-btn${filter === key ? " vop-filter-btn--active" : ""}`}
            >
              {label}
              <span className="vop-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="vop-center"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="vop-empty">
          <div className="vop-empty__icon"><FiPackage size={32} /></div>
          <p className="vop-empty__text">
            {filter === "all" ? "No orders yet." : `No ${STATUS_LABELS[filter]?.toLowerCase()} orders.`}
          </p>
        </div>
      ) : (
        <div className="vop-list">
          {filtered.map((order) => {
            const pay = paymentLabel(order);
            return (
              <div
                key={order._id}
                className="vop-card"
                onClick={() => navigate(`/vendor/orders/${order._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/vendor/orders/${order._id}`)}
              >
                {/* Top Row */}
                <div className="vop-card__top">
                  <div className="vop-card__id-group">
                    <span className="vop-card__id">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className="vop-card__date">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="vop-card__badges">
                    <span className={`vop-status-badge vop-status-badge--${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className={pay.cls}>{pay.text}</span>
                  </div>
                </div>

                {/* Customer */}
                {order.customer && (
                  <div className="vop-card__customer">
                    <FiUser size={13} />
                    <span className="vop-card__customer-name">{order.customer.name}</span>
                    <span className="vop-card__customer-email">{order.customer.email}</span>
                  </div>
                )}

                {/* Product Thumbs */}
                <div className="vop-card__thumbs">
                  {order.items.slice(0, 5).map((item, i) => (
                    <div key={i} className="vop-thumb">
                      {item.image
                        ? <img src={item.image} alt={item.name} />
                        : <FiPackage size={14} />}
                    </div>
                  ))}
                  {order.items.length > 5 && (
                    <span className="vop-card__more">+{order.items.length - 5}</span>
                  )}
                  <span className="vop-card__unit-count">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                  </span>
                  <span className="vop-card__amount">₹{order.totalAmount?.toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div className="vop-card__footer" onClick={(e) => e.stopPropagation()}>
                  <div className="vop-card__status-actions">
                    {NEXT_STATUSES[order.status]?.map((s) => (
                      <button
                        key={s}
                        disabled={updatingId === order._id}
                        onClick={(e) => handleStatusChange(e, order._id, s)}
                        className={`vop-status-btn${s === "cancelled" ? " vop-status-btn--cancel" : " vop-status-btn--advance"}`}
                      >
                        {updatingId === order._id ? "Updating…" : `Mark as ${s}`}
                      </button>
                    ))}
                  </div>
                  <button
                    className="vop-detail-btn"
                    onClick={(e) => { e.stopPropagation(); navigate(`/vendor/orders/${order._id}`); }}
                  >
                    <FiExternalLink size={13} /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
