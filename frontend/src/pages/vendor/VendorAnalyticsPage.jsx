import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorAnalytics } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FiTrendingUp, FiShoppingBag, FiUsers, FiDollarSign, FiAlertTriangle } from "react-icons/fi";
import "./VendorAnalyticsPage.css";

const PIE_COLORS = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  shipped: "#6366F1",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="vanalytics-tooltip">
      <p className="vanalytics-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === "revenue" ? `₹${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function VendorAnalyticsPage() {
  const dispatch = useDispatch();
  const { vendorAnalytics: data, loading } = useSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchVendorAnalytics());
  }, [dispatch]);

  if (loading || !data) return (
    <div className="spinner-center" style={{ height: "16rem" }}><Spinner size="lg" /></div>
  );

  const { totals, revenueByDay, ordersByStatus, topProducts, recentOrders, lowStock } = data;

  const pieData = ordersByStatus.map((s) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
    color: PIE_COLORS[s._id] || "#9CA3AF",
  }));

  return (
    <div className="vanalytics-page">
      <h1 className="vanalytics-title">Sales Analytics</h1>

      <div className="vanalytics-kpi-grid">
        {[
          { label: "Total Revenue", value: formatCurrency(totals.totalRevenue), icon: FiDollarSign, iconClass: "icon--green" },
          { label: "Paid Revenue", value: formatCurrency(totals.paidRevenue), icon: FiTrendingUp, iconClass: "icon--indigo" },
          { label: "Total Orders", value: totals.totalOrders, icon: FiShoppingBag, iconClass: "icon--blue" },
          { label: "Unique Customers", value: totals.uniqueCustomers, icon: FiUsers, iconClass: "icon--purple" },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="stats-card">
            <div className={`stats-card__icon-wrap ${iconClass}`}>
              <Icon size={20} />
            </div>
            <p className="stats-card__value">{value}</p>
            <p className="stats-card__label">{label}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="vanalytics-alert">
          <div className="vanalytics-alert-header">
            <FiAlertTriangle size={18} />
            <h3>Low Stock Alert ({lowStock.length} products)</h3>
          </div>
          <div className="vanalytics-alert-chips">
            {lowStock.map((p) => (
              <span key={p._id} className="vanalytics-alert-chip">
                {p.name} — {p.stock} left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="vanalytics-revenue-card">
        <h2 className="vanalytics-revenue-card__title">Revenue — Last 30 Days</h2>
        {revenueByDay.length === 0 ? (
          <div className="vanalytics-no-data">
            <FiTrendingUp size={36} />
            <p>No order data yet. Make your first sale!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} dot={false} name="revenue" />
              <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} dot={false} name="orders" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="vanalytics-charts-row">
        <div className="chart-card">
          <h2 className="chart-card__title">Orders by Status</h2>
          {pieData.length === 0 ? (
            <div className="vanalytics-no-data--center">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h2 className="chart-card__title">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <div className="vanalytics-no-data--center">No sales yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topProducts.map((p) => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, revenue: p.revenue, sold: p.unitsSold }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="vanalytics-recent-table">
        <h2 className="vanalytics-recent-table__title">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="vanalytics-empty-orders">No orders yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--clr-text-500)" }}>#{order._id.slice(-6).toUpperCase()}</td>
                    <td style={{ fontWeight: 500, color: "#1f2937" }}>{order.customer?.name || "—"}</td>
                    <td style={{ fontWeight: 600 }}>₹{order.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge--${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--clr-text-500)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
