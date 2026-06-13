import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders } from "../../features/admin/adminSlice";
import Spinner from "../../components/common/Spinner";
import { FiPackage, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./AdminOrdersPage.css";

const STATUS_TABS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_STYLE = {
  pending:   { bg: "#fef9c3", color: "#b45309", label: "Pending"   },
  confirmed: { bg: "#dbeafe", color: "#1d4ed8", label: "Confirmed" },
  shipped:   { bg: "#e0e7ff", color: "#4f46e5", label: "Shipped"   },
  delivered: { bg: "#d1fae5", color: "#065f46", label: "Delivered" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  payment_pending: { bg: "#ffedd5", color: "#c2410c", label: "Awaiting Payment" },
};

const PAY_STYLE = {
  paid:    { bg: "#d1fae5", color: "#065f46" },
  unpaid:  { bg: "#fee2e2", color: "#991b1b" },
  refunded:{ bg: "#e0e7ff", color: "#4f46e5" },
};

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const { orders, ordersTotal, loading } = useSelector((s) => s.admin);

  const [status, setStatus] = useState("all");
  const [page,   setPage]   = useState(1);

  const LIMIT = 15;
  const pages = Math.ceil(ordersTotal / LIMIT);

  const load = useCallback(() => {
    dispatch(fetchAdminOrders({
      status: status !== "all" ? status : undefined,
      page,
      limit: LIMIT,
    }));
  }, [dispatch, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="aorders">
      <div className="aorders__header">
        <div>
          <h1 className="aorders__title">Orders</h1>
          <p className="aorders__subtitle">{ordersTotal} total orders across all stores</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="aorders__tabs">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            className={`aorders__tab${status === s ? " aorders__tab--active" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="aorders__spinner"><Spinner /></div>
      ) : orders.length === 0 ? (
        <div className="aorders__empty">
          <FiPackage size={40} />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="aorders__table-wrap">
          <table className="aorders__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Store</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const st  = STATUS_STYLE[order.status]  || { bg: "#f3f4f6", color: "#6b7280", label: order.status };
                const pay = PAY_STYLE[order.paymentStatus] || { bg: "#f3f4f6", color: "#6b7280" };
                const shortId = order._id.toString().slice(-8).toUpperCase();
                return (
                  <tr key={order._id}>
                    <td>
                      <span className="aorders__id">#{shortId}</span>
                    </td>
                    <td>
                      <p className="aorders__cname">{order.customer?.name || "—"}</p>
                      <p className="aorders__cemail">{order.customer?.email || ""}</p>
                    </td>
                    <td>
                      <span className="aorders__store">{order.store?.name || "—"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="aorders__amount">
                        ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <span
                        className="aorders__pay-badge"
                        style={{ background: pay.bg, color: pay.color }}
                      >
                        {order.paymentStatus || "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="aorders__status-badge"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="aorders__date">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="aorders__pagination">
          <button
            className="aorders__page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FiChevronLeft size={15} />
          </button>
          <span className="aorders__page-info">Page {page} of {pages}</span>
          <button
            className="aorders__page-btn"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
          >
            <FiChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
