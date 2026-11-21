import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Listing } from "../lib/types";
import { categoryLabel, formatDate, formatPrice, formatQuantity } from "../lib/format";
import { ImagePicker, MAX_IMAGES } from "../components/ImagePicker";
import { Alert, ErrorMessage, StatusBadge } from "../components/ui";

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.getListing(id).then(setListing).catch(setError);
  }, [id]);

  if (error) return <><ErrorMessage error={error} /><Link to="/listings">← Back to listings</Link></>;
  if (!listing) return <div className="page-center muted">Loading…</div>;

  const run = async (fn: () => Promise<Listing | null>, message: string) => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const updated = await fn();
      if (updated) setListing(updated);
      setNotice(message);
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(false);
    }
  };

  const images = listing.images.filter((i) => i.url);
  const owner = listing.is_owner;

  return (
    <div className="detail">
      <Link to={owner ? "/my-listings" : "/listings"} className="muted small">← Back</Link>

      <div className="detail-grid">
        <div>
          <div className={`gallery ${images.length ? "" : `placeholder placeholder-${listing.waste_category}`}`}>
            {images.length ? <img src={images[Math.min(active, images.length - 1)].url!} alt={listing.material_name} />
              : <span>{categoryLabel[listing.waste_category]}</span>}
          </div>
          {(images.length > 1 || (owner && images.length > 0)) && (
            <div className="thumbs">
              {images.map((img, i) => (
                <button key={img.path} className={`thumb ${i === active ? "selected" : ""}`} onClick={() => setActive(i)}>
                  <img src={img.url!} alt="" />
                  {owner && listing.status === "active" && (
                    <span className="thumb-remove" role="button" aria-label="Delete photo"
                      onClick={(e) => { e.stopPropagation(); void run(() => api.removeImage(listing.listing_id, img.path), "Photo removed."); setActive(0); }}>×</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card-row">
            <span className={`chip chip-${listing.waste_category}`}>{categoryLabel[listing.waste_category]}</span>
            <StatusBadge status={listing.status} />
          </div>
          <h1>{listing.material_name}</h1>
          <p className="price">{formatPrice(listing.expected_price)}</p>
          <dl className="facts">
            <dt>Quantity</dt><dd>{formatQuantity(listing.quantity, listing.unit)}</dd>
            <dt>Condition</dt><dd>{listing.material_condition}</dd>
            <dt>Location</dt><dd>{listing.location}</dd>
            <dt>Listed</dt><dd>{formatDate(listing.created_at)}</dd>
          </dl>
          {listing.description && <p className="description">{listing.description}</p>}

          {notice && <Alert kind="success">{notice}</Alert>}
          <ErrorMessage error={actionError} />

          {owner ? (
            <div className="owner-panel card">
              <h3>Manage this listing</h3>
              {listing.status === "active" && (
                <>
                  <ImagePicker files={newFiles} onChange={setNewFiles} remaining={MAX_IMAGES - listing.images.length} />
                  {newFiles.length > 0 && (
                    <button className="btn btn-primary btn-sm" disabled={busy}
                      onClick={() => run(async () => { const l = await api.uploadImages(listing.listing_id, newFiles); setNewFiles([]); return l; }, "Photos uploaded.")}>
                      Upload {newFiles.length} photo{newFiles.length === 1 ? "" : "s"}
                    </button>
                  )}
                </>
              )}
              <div className="actions">
                {listing.status === "active" && <Link className="btn btn-ghost btn-sm" to={`/listings/${listing.listing_id}/edit`}>Edit details</Link>}
                {listing.status === "active" && (
                  <button className="btn btn-ghost btn-sm" disabled={busy}
                    onClick={() => run(() => api.updateListing(listing.listing_id, { status: "cancelled" }), "Listing cancelled - it's hidden from others.")}>
                    Cancel listing
                  </button>
                )}
                {listing.status === "cancelled" && (
                  <button className="btn btn-ghost btn-sm" disabled={busy}
                    onClick={() => run(() => api.updateListing(listing.listing_id, { status: "active" }), "Listing is active again.")}>
                    Reopen listing
                  </button>
                )}
                <button className="btn btn-danger btn-sm" disabled={busy}
                  onClick={async () => {
                    if (!window.confirm("Delete this listing permanently? This cannot be undone.")) return;
                    setBusy(true);
                    try { await api.deleteListing(listing.listing_id); navigate("/my-listings", { replace: true }); }
                    catch (e) { setActionError(e); setBusy(false); }
                  }}>
                  Delete
                </button>
              </div>
              {(listing.status === "reserved" || listing.status === "completed") && (
                <p className="muted small">This listing is {listing.status} through a collection request and can't be edited.</p>
              )}
            </div>
          ) : (
            <div className="card owner-panel">
              <p className="muted small">Collection requests from verified partners are coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
