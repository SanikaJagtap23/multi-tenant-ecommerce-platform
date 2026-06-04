import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminAnalytics } from "../../features/order/orderSlice";
import Spinner from "../../components/common/Spinner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FiDollarSign, FiShoppingBag, FiUsers, FiHome, FiTrendingUp } from "react-icons/fi";
import "./AdminAnalyticsPage.css";

const PIE_COLORS = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  shipped: "#6366F1",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="aanalytics-tooltip">
      <p className="aanalytics-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === "revenue" ? `₹${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const dispatch = useDispatch();
  const { adminAnalytics: data, loading } = useSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchAdminAnalytics());
  }, [dispatch]);

  if (loading || !data) return (
    <div className="spinner-center" style={{ height: "16rem" }}><Spinner size="lg" /></div>
  );

  const { totals, revenueByDay, ordersByStatus, topStores } = data;

  const pieData = ordersByStatus.map((s) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
    color: PIE_COLORS[s._id] || "#9CA3AF",
  }));

  return (
    <div className="aanalytics-page">
      <h1 className="aanalytics-title">Platform Analytics</h1>

      <div className="aanalytics-kpi-grid">
        {[
          { label: "Total Revenue", value: `₹${Number(totals.totalRevenue || 0).toLocaleString()}`, icon: FiDollarSign, iconClass: "icon--green" },
          { label: "Total Orders", value: totals.totalOrders || 0, icon: FiShoppingBag, iconClass: "icon--blue" },
          { label: "Unique Buyers", value: totals.uniqueCustomers || 0, icon: FiUsers, iconClass: "icon--purple" },
          { label: "Active Stores", value: totals.totalStores || 0, icon: FiHome, iconClass: "icon--indigo" },
          { label: "Total Vendors", value: totals.totalVendors || 0, icon: FiUsers, iconClass: "icon--rose" },
          { label: "Customers", value: totals.totalCustomers || 0, icon: FiTrendingUp, iconClass: "icon--amber" },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="stats-card">
            <div className={`stats-card__icon-wrap ${iconClass}`}>
              <Icon size={18} />
            </div>
            <p className="stats-card__value">{value}</p>
            <p className="stats-card__label">{label}</p>
          </div>
        ))}
      </div>

      <div className="aanalytics-revenue-card">
        <h2 className="aanalytics-revenue-card__title">Platform Revenue — Last 30 Days</h2>
        {revenueByDay.length === 0 ? (
          <div className="aanalytics-no-data">
            <FiTrendingUp size={36} />
            <p>No revenue data yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
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

      <div className="aanalytics-charts-row">
        <div className="chart-card">
          <h2 className="chart-card__title">Orders by Status</h2>
          {pieData.length === 0 ? (
            <div className="aanalytics-no-data--center">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h2 className="chart-card__title">Top Stores by Revenue</h2>
          {topStores.length === 0 ? (
            <div className="aanalytics-no-data--center">No sales yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topStores.map((s) => ({
                  name: s.name?.length > 12 ? s.name.slice(0, 12) + "…" : s.name || "Unknown",
                  revenue: s.revenue,
                  orders: s.orders,
                }))}
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

      {topStores.length > 0 && (
        <div className="aanalytics-top-stores-table">
          <h2 className="aanalytics-top-stores-table__title">Top Performing Stores</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Store</th>
                  <th style={{ textAlign: "right" }}>Orders</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topStores.map((store, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--clr-text-400)", fontWeight: 700, fontSize: "1.125rem" }}>#{i + 1}</td>
                    <td style={{ fontWeight: 600, color: "#1f2937" }}>{store.name || "—"}</td>
                    <td style={{ textAlign: "right", color: "var(--clr-text-600)" }}>{store.orders}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--clr-primary)" }}>₹{store.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
