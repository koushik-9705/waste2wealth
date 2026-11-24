import { Link } from "react-router-dom";
import type { Listing } from "../lib/types";
import { categoryLabel, formatPrice, formatQuantity, pricePerUnit } from "../lib/format";
import { StatusBadge } from "./ui";
import { Icon } from "./Icon";
import { MaterialArt } from "./widgets";

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images.find((i) => i.url)?.url;
  const perUnit = pricePerUnit(listing);
  return (
    <article className="listing-card card">
      <Link to={`/listings/${listing.listing_id}`} className="lc-media">
        {cover ? <img src={cover} alt={listing.material_name} loading="lazy" /> : <MaterialArt material={listing.material_name} category={listing.waste_category} />}
        <span className={`lc-tag lc-tag-${listing.waste_category}`}><Icon name={listing.waste_category === "agricultural" ? "leaf" : "box"} size={12} /> {categoryLabel[listing.waste_category]}</span>
        {listing.status !== "active" && <span className="lc-status"><StatusBadge status={listing.status} /></span>}
      </Link>
      <div className="lc-body">
        <Link to={`/listings/${listing.listing_id}`} className="lc-title">{listing.material_name}</Link>
        <p className="lc-meta">
          {formatQuantity(listing.quantity, listing.unit)} • {perUnit ?? formatPrice(listing.expected_price)}
        </p>
        <p className="lc-loc"><Icon name="pin" size={14} /> {listing.location}</p>
        <Link to={`/listings/${listing.listing_id}`} className="btn btn-primary btn-sm btn-block">
          {listing.is_owner ? "Manage listing" : "Request Pickup"}
        </Link>
      </div>
    </article>
  );
}
