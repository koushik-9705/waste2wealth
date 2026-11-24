import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Listing, Page, SortBy, WasteCategory } from "../lib/types";
import { ListingCard } from "../components/ListingCard";
import { EmptyState, ErrorMessage, Pagination } from "../components/ui";
import { Icon } from "../components/Icon";

const SORTS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "quantity_desc", label: "Largest quantity" },
  { value: "quantity_asc", label: "Smallest quantity" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
];

/** Quick chips: the two real categories plus common material searches. */
const CHIPS: { label: string; category?: WasteCategory; material?: string }[] = [
  { label: "All" },
  { label: "Agricultural", category: "agricultural" },
  { label: "E-waste", category: "electronic" },
  { label: "Plastic", material: "plastic" },
  { label: "Paper", material: "paper" },
  { label: "Metal", material: "metal" },
  { label: "Organic", material: "organic" },
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
  const [showFilters, setShowFilters] = useState(false);
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

  const activeChip = CHIPS.find((c) =>
    (c.category ?? "") === category && (c.material ?? "") === material.toLowerCase()) ?? null;

  return (
    <>
      <section className="browse-banner">
        <div>
          <h1>Browse Waste Listings</h1>
          <p>Find quality waste materials near you</p>
        </div>
        <svg viewBox="0 0 260 120" aria-hidden="true" className="banner-art">
          <rect x="20" y="58" width="70" height="50" rx="4" fill="#c99a5b" /><rect x="20" y="58" width="70" height="12" fill="#b3864b" />
          <rect x="70" y="30" width="80" height="60" rx="4" fill="#d9ae72" /><rect x="70" y="30" width="80" height="14" fill="#c4975d" />
          <rect x="140" y="62" width="64" height="46" rx="4" fill="#bf8f52" /><rect x="140" y="62" width="64" height="11" fill="#a97c45" />
          <path d="M205 40c0-16 10-26 28-28-2 18-12 28-28 28z" fill="#7cc242" />
        </svg>
      </section>

      <div className="chip-bar">
        <div className="chips" role="toolbar" aria-label="Filter by type">
          {CHIPS.map((c) => (
            <button key={c.label} className={`chip-btn ${activeChip?.label === c.label ? "active" : ""}`}
              onClick={() => update({ category: c.category ?? "", material: c.material ?? "" })}>
              {c.label}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
          Filter <Icon name="chevronDown" size={15} />
        </button>
      </div>

      {showFilters && (
        <form className="filter-panel card" onSubmit={(e) => { e.preventDefault(); update({ location: locationInput.trim() }); }}>
          <label className="field">
            <span>Location</span>
            <input placeholder="e.g. Ballari, Guntur" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
          </label>
          <label className="field">
            <span>Sort by</span>
            <select value={sortBy} onChange={(e) => update({ sort_by: e.target.value })}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <div className="filter-actions">
            <button className="btn btn-primary btn-sm" type="submit">Apply</button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setLocationInput(""); setParams({}); }}>Clear all</button>
          </div>
        </form>
      )}

      {material && !activeChip && <p className="muted small">Showing results for “{material}”</p>}
      <ErrorMessage error={error} />
      {loading && !data ? (
        <div className="grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}</div>
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
