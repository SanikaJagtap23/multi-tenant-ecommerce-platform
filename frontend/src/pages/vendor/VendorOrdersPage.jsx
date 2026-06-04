import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorOrders, updateOrderStatus } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import { FiPackage, FiChevronDown, FiChevronUp, FiUser, FiMapPin } from "react-icons/fi";
import "./VendorOrdersPage.css";

const NEXT_STATUSES = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function VendorOrdersPage() {
  const dispatch = useDispatch();
  const { vendorOrders, loading } = useSelector((s) => s.order);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    dispatch(fetchVendorOrders());
  }, [dispatch]);

  const filtered = filter === "all" ? vendorOrders : vendorOrders.filter((o) => o.status === filter);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      toast.success(`Order status updated to "${newStatus}".`);
    } catch (err) {
      toast.error(err || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="vorders-page">
      <div className="vorders-header">
        <h1 className="vorders-title">Customer Orders</h1>
        <span className="vorders-count">{vendorOrders.length} total</span>
      </div>

      <div className="filter-tabs">
        {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`filter-tab${filter === s ? " filter-tab--active" : ""}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span style={{ marginLeft: "0.375rem", fontSize: "0.75rem", opacity: 0.7 }}>
                ({vendorOrders.filter((o) => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner-center"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="vorder-empty">
          <FiPackage size={48} />
          <p>{filter === "all" ? "No orders yet." : `No ${filter} orders.`}</p>
        </div>
      ) : (
        <div className="vorders-list">
          {filtered.map((order) => (
            <div key={order._id} className="vorder-card">
              <div className="vorder-card__header">
                <div className="vorder-card__info-row">
                  <div className="vorder-card__info">
                    <p className="vorder-card__id">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="vorder-card__date">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    {order.customer && (
                      <div className="vorder-card__customer">
                        <FiUser size={12} />
                        <span className="vorder-card__customer-name">{order.customer.name}</span>
                        <span className="vorder-card__customer-email">({order.customer.email})</span>
                      </div>
                    )}
                  </div>

                  <div className="vorder-card__right">
                    <span className={`badge badge--${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className="vorder-card__amount">
                      ₹{order.totalAmount?.toLocaleString()}
                    </span>
                    <span className={
                      order.paymentStatus === "paid" || (order.paymentMethod === "cod" && order.status === "delivered")
                        ? "vorder-card__payment-status--paid"
                        : "vorder-card__payment-status--cod"
                    }>
                      {order.paymentStatus === "paid" || (order.paymentMethod === "cod" && order.status === "delivered")
                        ? "✓ COD Collected"
                        : "⏳ COD (Pending)"}
                    </span>
                  </div>
                </div>

                <div className="vorder-card__preview-images">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="vorder-card__thumb">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="vorder-card__thumb__empty">
                          <FiPackage size={14} style={{ color: "#d1d5db" }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <span className="vorder-card__more">+{order.items.length - 4} more</span>
                  )}
                  <span className="vorder-card__units">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} unit(s)
                  </span>
                </div>

                <div className="vorder-card__actions">
                  <div className="vorder-card__status-btns">
                    {NEXT_STATUSES[order.status].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(order._id, s)}
                        disabled={updatingId === order._id}
                        className={`vorder-card__status-btn ${s === "cancelled" ? "vorder-card__status-btn--cancel" : "vorder-card__status-btn--progress"}`}
                      >
                        {updatingId === order._id ? "..." : `Mark as ${s}`}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    className="vorder-card__expand-btn"
                  >
                    {expandedId === order._id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    Details
                  </button>
                </div>
              </div>

              {expandedId === order._id && (
                <div className="vorder-card__expanded">
                  <div className="vorder-card__expanded-section">
                    <p className="vorder-card__expanded-label">Items</p>
                    <div>
                      {order.items.map((item, i) => (
                        <div key={i} className="vorder-card__item-row">
                          <div className="vorder-card__item-image">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <FiPackage style={{ color: "#d1d5db", margin: "auto", display: "block" }} />
                            )}
                          </div>
                          <div className="vorder-card__item-info">
                            <p>{item.name}</p>
                            <p>Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                          </div>
                          <span className="vorder-card__item-total">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="vorder-card__items-total">
                      <span>Total</span>
                      <span>₹{order.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  {order.shippingAddress?.street && (
                    <div className="vorder-card__expanded-section">
                      <p className="vorder-card__expanded-label">
                        <FiMapPin size={12} /> Delivery Address
                      </p>
                      <div className="vorder-card__address-box">
                        <p>{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
                        {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                      </div>
                    </div>
                  )}

                  {order.notes && (
                    <div className="vorder-card__expanded-section">
                      <p className="vorder-card__expanded-label">Customer Note</p>
                      <p className="vorder-card__notes-box">{order.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
