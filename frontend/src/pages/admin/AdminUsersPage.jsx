import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
  deleteAdminUser,
} from "../../features/admin/adminSlice";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import {
  FiSearch, FiUsers, FiSlash, FiCheckCircle,
  FiTrash2, FiChevronLeft, FiChevronRight, FiFilter,
} from "react-icons/fi";
import "./AdminUsersPage.css";

const ROLE_LABEL = { customer: "Customer", vendor: "Vendor" };
const ROLE_COLOR = { customer: "blue",  vendor: "purple" };

export default function AdminUsersPage({ roleFilter = "customer" }) {
  const dispatch = useDispatch();
  const { users, usersTotal, loading } = useSelector((s) => s.admin);

  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("all");
  const [page,    setPage]    = useState(1);
  const [confirm, setConfirm] = useState(null); // { type, user }

  const LIMIT = 15;
  const pages = Math.ceil(usersTotal / LIMIT);

  const load = useCallback(() => {
    dispatch(fetchAdminUsers({
      role:   roleFilter,
      status: status !== "all" ? status : undefined,
      search: search || undefined,
      page,
      limit: LIMIT,
    }));
  }, [dispatch, roleFilter, status, search, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [roleFilter, status, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleToggleBan = async (user) => {
    const result = await dispatch(updateAdminUserStatus({ id: user._id, isActive: !user.isActive }));
    if (updateAdminUserStatus.fulfilled.match(result)) {
      toast.success(user.isActive ? `${user.name} banned` : `${user.name} unbanned`);
    } else {
      toast.error(result.payload || "Failed");
    }
    setConfirm(null);
  };

  const handleRoleChange = async (user) => {
    const newRole = user.role === "vendor" ? "customer" : "vendor";
    const result  = await dispatch(updateAdminUserRole({ id: user._id, role: newRole }));
    if (updateAdminUserRole.fulfilled.match(result)) {
      toast.success(`Role changed to ${newRole}`);
    } else {
      toast.error(result.payload || "Failed");
    }
    setConfirm(null);
  };

  const handleDelete = async (user) => {
    const result = await dispatch(deleteAdminUser(user._id));
    if (deleteAdminUser.fulfilled.match(result)) {
      toast.success(`${user.name} deleted`);
    } else {
      toast.error(result.payload || "Failed");
    }
    setConfirm(null);
  };

  const pageTitle = roleFilter === "vendor" ? "Vendors" : "Customers";

  return (
    <div className="ausers">
      {/* Header */}
      <div className="ausers__header">
        <div>
          <h1 className="ausers__title">{pageTitle}</h1>
          <p className="ausers__subtitle">{usersTotal} total {pageTitle.toLowerCase()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ausers__toolbar">
        <form onSubmit={handleSearch} className="ausers__search">
          <FiSearch className="ausers__search-icon" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${pageTitle.toLowerCase()} by name or email…`}
            className="ausers__search-input"
          />
        </form>

        <div className="ausers__filter-row">
          <FiFilter size={14} style={{ color: "var(--clr-text-400)" }} />
          {["all", "active", "banned"].map((s) => (
            <button
              key={s}
              className={`ausers__filter-btn${status === s ? " ausers__filter-btn--active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="ausers__spinner"><Spinner /></div>
      ) : users.length === 0 ? (
        <div className="ausers__empty">
          <FiUsers size={40} />
          <p>No {pageTitle.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="ausers__table-wrap">
          <table className="ausers__table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <tr key={user._id}>
                    <td>
                      <div className="ausers__user-cell">
                        <div className={`ausers__avatar ausers__avatar--${ROLE_COLOR[user.role] || "blue"}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="ausers__user-name">{user.name}</p>
                          <p className="ausers__user-email">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ausers__badge ausers__badge--${ROLE_COLOR[user.role] || "blue"}`}>
                        {ROLE_LABEL[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`ausers__status ${user.isActive ? "ausers__status--active" : "ausers__status--banned"}`}>
                        {user.isActive ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td className="ausers__date">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </td>
                    <td>
                      <div className="ausers__actions">
                        {/* Ban / Unban */}
                        <button
                          className={`ausers__action-btn ${user.isActive ? "ausers__action-btn--ban" : "ausers__action-btn--unban"}`}
                          onClick={() => setConfirm({ type: user.isActive ? "ban" : "unban", user })}
                          title={user.isActive ? "Ban user" : "Unban user"}
                        >
                          {user.isActive ? <FiSlash size={14} /> : <FiCheckCircle size={14} />}
                          {user.isActive ? "Ban" : "Unban"}
                        </button>

                        {/* Change role */}
                        <button
                          className="ausers__action-btn ausers__action-btn--role"
                          onClick={() => setConfirm({ type: "role", user })}
                          title="Change role"
                        >
                          {user.role === "vendor" ? "→ Customer" : "→ Vendor"}
                        </button>

                        {/* Delete */}
                        <button
                          className="ausers__action-btn ausers__action-btn--delete"
                          onClick={() => setConfirm({ type: "delete", user })}
                          title="Delete user"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
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
        <div className="ausers__pagination">
          <button
            className="ausers__page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FiChevronLeft size={15} />
          </button>
          <span className="ausers__page-info">Page {page} of {pages}</span>
          <button
            className="ausers__page-btn"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
          >
            <FiChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="ausers__modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="ausers__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ausers__modal-title">
              {confirm.type === "ban"    && "Ban User"}
              {confirm.type === "unban"  && "Unban User"}
              {confirm.type === "role"   && "Change Role"}
              {confirm.type === "delete" && "Delete User"}
            </h3>
            <p className="ausers__modal-body">
              {confirm.type === "ban"    && `Ban ${confirm.user.name}? They will lose access to the platform.`}
              {confirm.type === "unban"  && `Restore access for ${confirm.user.name}?`}
              {confirm.type === "role"   && `Change ${confirm.user.name}'s role from ${confirm.user.role} to ${confirm.user.role === "vendor" ? "customer" : "vendor"}?`}
              {confirm.type === "delete" && `Permanently delete ${confirm.user.name}? This cannot be undone.`}
            </p>
            <div className="ausers__modal-actions">
              <button className="ausers__modal-cancel" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className={`ausers__modal-confirm ${confirm.type === "delete" || confirm.type === "ban" ? "ausers__modal-confirm--danger" : "ausers__modal-confirm--primary"}`}
                onClick={() => {
                  if (confirm.type === "ban" || confirm.type === "unban") handleToggleBan(confirm.user);
                  else if (confirm.type === "role")   handleRoleChange(confirm.user);
                  else if (confirm.type === "delete") handleDelete(confirm.user);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
