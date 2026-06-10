import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiPackage } from "react-icons/fi";
import "./PaymentResultPage.css";

export default function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state    = location.state;

  useEffect(() => {
    if (!state || state.success === undefined) {
      navigate("/cart", { replace: true });
    }
  }, [state, navigate]);

  if (!state || state.success === undefined) return null;

  const { success, orders = [], error } = state;

  if (success) {
    return (
      <div className="prp">
        <div className="prp-card prp-card--success">
          <FiCheckCircle className="prp-icon prp-icon--success" />
          <h1 className="prp-title">Payment Successful!</h1>
          <p className="prp-sub">
            Your {orders.length > 1 ? `${orders.length} orders have` : "order has"} been placed.
            You&apos;ll receive a confirmation shortly.
          </p>

          {orders.length > 0 && (
            <div className="prp-orders">
              {orders.map((order) => (
                <div key={order._id} className="prp-order-row">
                  <div className="prp-order-row__left">
                    <FiPackage size={14} />
                    <span>{order.store?.name || "Store"}</span>
                    <span className="prp-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <span className="prp-order-amount">₹{order.totalAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="prp-actions">
            <button className="prp-btn prp-btn--primary" onClick={() => navigate("/my-orders")}>
              View My Orders
            </button>
            <Link to="/" className="prp-btn prp-btn--ghost">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prp">
      <div className="prp-card prp-card--failed">
        <FiXCircle className="prp-icon prp-icon--failed" />
        <h1 className="prp-title">Payment Failed</h1>
        <p className="prp-sub">{error || "Payment was not completed. Please try again."}</p>

        <div className="prp-actions">
          <button className="prp-btn prp-btn--danger" onClick={() => navigate(-1)}>
            Try Again
          </button>
          <Link to="/cart" className="prp-btn prp-btn--ghost">Return to Cart</Link>
        </div>
      </div>
    </div>
  );
}
