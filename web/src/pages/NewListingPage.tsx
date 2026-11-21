import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { ListingInput } from "../lib/types";
import { canCreateListings, useAuth } from "../auth/AuthProvider";
import { ListingForm } from "../components/ListingForm";
import { ImagePicker } from "../components/ImagePicker";
import { Alert, ErrorMessage } from "../components/ui";

export function NewListingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (profile && !canCreateListings(profile)) return <Navigate to="/listings" replace />;

  const submit = async (input: ListingInput) => {
    setBusy(true);
    setError(null);
    try {
      const listing = await api.createListing(input);
      if (files.length) {
        try {
          await api.uploadImages(listing.listing_id, files);
        } catch (e) {
          // The listing exists; let the user retry photos from the detail page.
          setWarning(`Listing created, but photos failed to upload: ${e instanceof Error ? e.message : e}`);
          setTimeout(() => navigate(`/listings/${listing.listing_id}`), 2500);
          return;
        }
      }
      navigate(`/listings/${listing.listing_id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="narrow">
      <h1>New listing</h1>
      <p className="muted">Tell buyers and recyclers what you have.</p>
      {warning && <Alert kind="info">{warning}</Alert>}
      <ErrorMessage error={error} />
      <div className="card">
        <ImagePicker files={files} onChange={setFiles} />
        <ListingForm submitLabel="Publish listing" busy={busy} onSubmit={submit} />
      </div>
    </div>
  );
}
