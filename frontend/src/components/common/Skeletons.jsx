import "./Skeletons.css";

export function ProductCardSkeleton() {
  return (
    <div className="skel-card">
      <div className="skel-card__image skel-shimmer" />
      <div className="skel-card__body">
        <div className="skel-line skel-line--sm skel-shimmer" />
        <div className="skel-line skel-line--lg skel-shimmer" />
        <div className="skel-line skel-line--md skel-shimmer" />
        <div className="skel-line skel-line--sm skel-shimmer" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="skel-detail">
      <div className="skel-detail__grid">
        <div className="skel-detail__gallery">
          <div className="skel-detail__main-image skel-shimmer" />
          <div className="skel-detail__thumbs">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skel-detail__thumb skel-shimmer" />
            ))}
          </div>
        </div>
        <div className="skel-detail__info">
          <div className="skel-line skel-line--sm skel-shimmer" style={{ width: "6rem" }} />
          <div className="skel-line skel-line--xl skel-shimmer" style={{ marginTop: "0.5rem" }} />
          <div className="skel-line skel-line--lg skel-shimmer" />
          <div className="skel-line skel-line--md skel-shimmer" style={{ marginTop: "1rem" }} />
          <div className="skel-line skel-line--sm skel-shimmer" />
          <div className="skel-line skel-line--lg skel-shimmer" />
          <div className="skel-line skel-line--sm skel-shimmer" />
          <div className="skel-line skel-line--xl skel-shimmer" style={{ marginTop: "1rem", height: "2.5rem", width: "100%", borderRadius: "0.75rem" }} />
        </div>
      </div>
    </div>
  );
}