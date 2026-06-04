import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1 className="not-found-code">404</h1>
      <h2 className="not-found-title">Page not found</h2>
      <p className="not-found-desc">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Go back home
      </Link>
    </div>
  );
}
