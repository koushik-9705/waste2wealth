import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Listing, Page, SortBy, WasteCategory } from "../lib/types";
import { ListingCard } from "../components/ListingCard";
import { EmptyState, ErrorMessage, Pagination } from "../components/ui";

const SORTS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "quantity_desc", label: "Largest quantity" },
  { value: "quantity_asc", label: "Smallest quantity" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
];

export function BrowsePage() {
  // Filters live in the URL so results are shareable and survive refresh.
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "") as WasteCategory | "";
  const material = params.get("material") ?? "";
  const location = params.get("location") ?? "";
  const sortBy = (params.get("sort_by") ?? "newest") as SortBy;
  const page = Number(params.get("page") ?? 1) || 1;

  const [data, setData] = useState<Page<Listing> | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [materialInput, setMaterialInput] = useState(material);
  const [locationInput, setLocationInput] = useState(location);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .browseListings({ category, material, location, sort_by: sortBy, page, page_size: 12, status: "active" })
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, material, location, sortBy, page]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) (v ? next.set(k, v) : next.delete(k));
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  return (
    <>
      <div className="page-head">
        <h1>Browse listings</h1>
        <p className="muted">Agricultural residue and e-waste available for reuse and recycling.</p>
      </div>

      <form className="filters card" onSubmit={(e) => { e.preventDefault(); update({ material: materialInput.trim(), location: locationInput.trim() }); }}>
        <select aria-label="Category" value={category} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All categories</option>
          <option value="agricultural">Agricultural residue</option>
          <option value="electronic">E-waste</option>
        </select>
        <input aria-label="Material" placeholder="Material (e.g. husk)" value={materialInput} onChange={(e) => setMaterialInput(e.target.value)} />
        <input aria-label="Location" placeholder="Location (e.g. Guntur)" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
        <select aria-label="Sort by" value={sortBy} onChange={(e) => update({ sort_by: e.target.value })}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" type="submit">Search</button>
      </form>

      <ErrorMessage error={error} />
      {loading && !data ? (
        <div className="page-center muted">Loading listings…</div>
      ) : data && data.items.length === 0 ? (
        <EmptyState title="No listings found">
          <p className="muted">Try different filters, or check back later.</p>
        </EmptyState>
      ) : data ? (
        <>
          <p className="muted small">{data.total} listing{data.total === 1 ? "" : "s"}</p>
          <div className={`grid ${loading ? "is-loading" : ""}`}>
            {data.items.map((l) => <ListingCard key={l.listing_id} listing={l} />)}
          </div>
          <Pagination page={data.page} totalPages={data.total_pages} onChange={(p) => update({ page: String(p) })} />
        </>
      ) : null}
    </>
  );
}
