import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Listing, ListingStatus, Page } from "../lib/types";
import { ListingCard } from "../components/ListingCard";
import { EmptyState, ErrorMessage, Pagination } from "../components/ui";
import { PageHeader } from "../components/widgets";
import { Icon } from "../components/Icon";

const TABS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "reserved", label: "Reserved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function MyListingsPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") ?? "") as ListingStatus | "";
  const page = Number(params.get("page") ?? 1) || 1;
  const [data, setData] = useState<Page<Listing> | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    api.myListings({ status, page, page_size: 12 })
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e) => !cancelled && setError(e));
    return () => { cancelled = true; };
  }, [status, page]);

  return (
    <>
      <PageHeader title="My Listings" subtitle="Everything you have listed, in any status."
        action={<Link to="/listings/new" className="btn btn-primary"><Icon name="plus" size={17} /> New listing</Link>} />

      <div className="seg-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.value} role="tab" aria-selected={status === t.value} className={status === t.value ? "active" : ""}
            onClick={() => setParams(t.value ? { status: t.value } : {})}>
            {t.label}
          </button>
        ))}
      </div>

      <ErrorMessage error={error} />
      {!data ? (
        !error && <div className="grid">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" />)}</div>
      ) : data.items.length === 0 ? (
        <EmptyState title={status ? `No ${status} listings` : "You haven't listed anything yet"}>
          <Link to="/listings/new" className="btn btn-primary">Create your first listing</Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid">{data.items.map((l) => <ListingCard key={l.listing_id} listing={l} />)}</div>
          <Pagination page={data.page} totalPages={data.total_pages}
            onChange={(p) => setParams({ ...(status ? { status } : {}), page: String(p) })} />
        </>
      )}
    </>
  );
}
