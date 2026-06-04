import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMyOrders } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import { FiShoppingBag, FiChevronDown, FiChevronUp, FiPackage, FiExternalLink } from "react-icons/fi";
import "./MyOrdersPage.css";

export default function MyOrdersPage() {
  const dispatch = useDispatch();
  const { myOrders, loading } = useSelector((s) => s.order);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const filtered = filter === "all" ? myOrders : myOrders.filter((o) => o.status === filter);

  if (loading) return (
    <div className="my-orders-loading">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="my-orders-page">
      <div className="my-orders-container">
        <h1 className="my-orders-title">
          <FiShoppingBag className="my-orders-title__icon" />
          My Orders
        </h1>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`filter-tab${filter === s ? " filter-tab--active" : ""}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="my-orders-empty">
            <FiShoppingBag className="my-orders-empty__icon" size={48} />
            <p>
              {filter === "all" ? "You haven't placed any orders yet." : `No ${filter} orders.`}
            </p>
            <Link to="/" className="my-orders-empty__btn">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="my-orders-list">
            {filtered.map((order) => (
              <div key={order._id} className="order-card">
                {/* Order header */}
                <div className="order-card__header">
                  <div className="order-card__top-row">
                    <div>
                      <p className="order-card__id">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="order-card__date">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        {" · "}
                        {order.store?.name && (
                          <span className="order-card__date-store">{order.store.name}</span>
                        )}
                      </p>
                    </div>

                    <div className="order-card__right">
                      <span className={`badge badge--${order.status}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className={`order-card__payment ${
                        order.paymentStatus === "paid" || (order.paymentMethod === "cod" && order.status === "delivered")
                          ? "order-card__payment--paid"
                          : `order-card__payment--${order.paymentStatus}`
                      }`}>
                        {order.paymentStatus === "paid" || (order.paymentMethod === "cod" && order.status === "delivered")
                          ? "✓ Paid"
                          : order.paymentStatus === "refunded" ? "Refunded" : "COD"}
                      </span>
                      <span className="order-card__amount">
                        ₹{order.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="order-card__preview">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="order-card__thumb">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <div className="order-card__thumb__placeholder">
                            <FiPackage size={14} />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="order-card__more-items">+{order.items.length - 3} more</span>
                    )}
                    <span className="order-card__unit-count">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="order-card__footer">
                    <Link to={`/order-confirmation/${order._id}`} className="order-card__view-link">
                      <FiExternalLink size={14} />
                      View Details
                    </Link>
                    <button
                      onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                      className="order-card__expand-btn"
                    >
                      {expandedId === order._id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      {expandedId === order._id ? "Hide" : "Show"} items
                    </button>
                  </div>
                </div>

                {/* Expanded items */}
                {expandedId === order._id && (
                  <div className="order-card__expanded">
                    <div className="order-card__expanded-list">
                      {order.items.map((item, i) => (
                        <div key={i} className="order-card__expanded-item">
                          <div className="order-card__expanded-image">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <div className="order-card__expanded-image__placeholder">
                                <FiPackage />
                              </div>
                            )}
                          </div>
                          <div className="order-card__expanded-details">
                            <p className="order-card__expanded-details__name">{item.name}</p>
                            <p className="order-card__expanded-details__qty">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                          </div>
                          <span className="order-card__expanded-total">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="order-card__expanded-grand">
                      <span>Total</span>
                      <span>₹{order.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
