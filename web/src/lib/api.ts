/**
 * Client for the Waste2Wealth FastAPI backend.
 * Attaches the Supabase access token and unwraps the {success, message, data|error} envelope.
 */
import { supabase } from "./supabase";
import type { Listing, ListingFilters, ListingInput, Page, Profile } from "./types";
import { isPreview, previewApi } from "./preview";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      `Cannot reach the backend at ${BASE_URL}. Start it (uvicorn app.main:app --port 8000 in backend/) ` +
        `and check VITE_API_BASE_URL in web/.env.local.`,
      0,
      "NETWORK_ERROR",
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(
      body?.message ?? `Request failed (${res.status})`,
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.details,
    );
  }
  return body.data as T;
}

function query(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

const realApi = {
  getMyProfile: () => request<Profile>("/profiles/me"),
  updateMyProfile: (changes: Partial<Profile>) =>
    request<Profile>("/profiles/me", { method: "PATCH", body: JSON.stringify(changes) }),

  browseListings: (f: ListingFilters) => request<Page<Listing>>(`/listings${query({ ...f })}`),
  myListings: (f: ListingFilters) => request<Page<Listing>>(`/listings/mine${query({ ...f })}`),
  getListing: (id: string) => request<Listing>(`/listings/${id}`),
  createListing: (input: ListingInput) =>
    request<Listing>("/listings", { method: "POST", body: JSON.stringify(input) }),
  updateListing: (id: string, changes: Partial<ListingInput> & { status?: "active" | "cancelled" }) =>
    request<Listing>(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
  deleteListing: (id: string) => request<null>(`/listings/${id}`, { method: "DELETE" }),
  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return request<Listing>(`/listings/${id}/images`, { method: "POST", body: form });
  },
  removeImage: (id: string, path: string) =>
    request<Listing>(`/listings/${id}/images${query({ path })}`, { method: "DELETE" }),
};

/** In UI preview mode (dev only) every call returns demo data instead of hitting the backend. */
export const api: typeof realApi = isPreview ? previewApi : realApi;
