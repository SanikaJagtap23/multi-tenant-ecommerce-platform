import { Link, useNavigate } from "react-router-dom";
import "./UnauthorizedPage.css";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="unauth-page">
      <h1 className="unauth-code">403</h1>
      <h2 className="unauth-title">Access Denied</h2>
      <p className="unauth-desc">
        You do not have permission to view this page.
      </p>
      <div className="unauth-actions">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
        >
          Go Back
        </button>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
