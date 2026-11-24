import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Listing, ListingInput } from "../lib/types";
import { ListingForm } from "../components/ListingForm";
import { Alert, ErrorMessage } from "../components/ui";
import { PageHeader } from "../components/widgets";

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) api.getListing(id).then(setListing).catch(setError);
  }, [id]);

  if (!listing) return error ? <ErrorMessage error={error} /> : <div className="page-center muted">Loading…</div>;
  if (!listing.is_owner || listing.status !== "active") {
    return <Alert kind="info">Only the owner can edit an active listing. <Link to={`/listings/${listing.listing_id}`}>Back</Link></Alert>;
  }

  const submit = async (input: ListingInput) => {
    setBusy(true);
    setError(null);
    // waste_category can't be changed after creation.
    const { waste_category: _ignored, ...changes } = input;
    void _ignored;
    try {
      await api.updateListing(listing.listing_id, changes);
      navigate(`/listings/${listing.listing_id}`);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <div className="narrow">
      <PageHeader title="Edit listing" subtitle={listing.material_name} />
      <ErrorMessage error={error} />
      <div className="card">
        <ListingForm initial={listing} lockCategory submitLabel="Save changes" busy={busy} onSubmit={submit} />
      </div>
    </div>
  );
}
