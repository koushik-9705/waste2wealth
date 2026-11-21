import { Link } from "react-router-dom";
import type { Listing } from "../lib/types";
import { categoryLabel, formatPrice, formatQuantity } from "../lib/format";
import { StatusBadge } from "./ui";

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images.find((i) => i.url)?.url;
  return (
    <Link to={`/listings/${listing.listing_id}`} className="card listing-card">
      <div className={`card-media ${cover ? "" : `placeholder placeholder-${listing.waste_category}`}`}>
        {cover ? <img src={cover} alt={listing.material_name} loading="lazy" /> : <span>{categoryLabel[listing.waste_category]}</span>}
      </div>
      <div className="card-body">
        <div className="card-row">
          <span className={`chip chip-${listing.waste_category}`}>{categoryLabel[listing.waste_category]}</span>
          {listing.status !== "active" && <StatusBadge status={listing.status} />}
        </div>
        <h3 className="card-title">{listing.material_name}</h3>
        <p className="muted small">{listing.location}</p>
        <div className="card-row card-footer">
          <strong>{formatQuantity(listing.quantity, listing.unit)}</strong>
          <span>{formatPrice(listing.expected_price)}</span>
        </div>
      </div>
    </Link>
  );
}
