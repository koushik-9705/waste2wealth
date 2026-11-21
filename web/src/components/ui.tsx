import type { ReactNode } from "react";
import { ApiError } from "../lib/api";
import type { ListingStatus } from "../lib/types";
import { statusLabel } from "../lib/format";

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

/** Shows an API error, including per-field validation messages. */
export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  if (error instanceof ApiError) {
    return (
      <Alert>
        {error.message}
        {error.details && error.details.length > 0 && (
          <ul className="error-list">
            {error.details.map((d, i) => (
              <li key={i}>
                {d.field ? <strong>{d.field}: </strong> : null}
                {d.message}
              </li>
            ))}
          </ul>
        )}
      </Alert>
    );
  }
  return <Alert>{error instanceof Error ? error.message : String(error)}</Alert>;
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`badge badge-${status}`}>{statusLabel[status]}</span>;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span className="muted">
        Page {page} of {totalPages}
      </span>
      <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
