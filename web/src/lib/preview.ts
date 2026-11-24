/**
 * UI PREVIEW MODE (development only).
 *
 * Set VITE_UI_PREVIEW=true in web/.env.local to browse every screen without
 * Supabase keys or the backend: you are "signed in" as a demo user and listing
 * calls return demo data. It is ignored in production builds.
 */
import type { Listing, ListingFilters, ListingInput, Page, Profile } from "./types";
import { demoListings } from "./demo";

export const isPreview = import.meta.env.DEV && import.meta.env.VITE_UI_PREVIEW === "true";

export const previewProfile: Profile = {
  user_id: "preview-user",
  full_name: "Keerthi Shree",
  phone: "+91 98765 43210",
  account_type: "both",
  organization_name: null,
  address: "Ward 12, Cowl Bazaar",
  city: "Ballari",
  state: "Karnataka",
  pincode: "583101",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

let store = [...demoListings];

function page(items: Listing[], f: ListingFilters): Page<Listing> {
  const size = f.page_size ?? 12;
  const p = f.page ?? 1;
  return { items: items.slice((p - 1) * size, p * size), page: p, page_size: size, total: items.length, total_pages: Math.max(1, Math.ceil(items.length / size)) };
}

function filter(items: Listing[], f: ListingFilters) {
  return items.filter((l) =>
    (!f.category || l.waste_category === f.category) &&
    (!f.status || l.status === f.status) &&
    (!f.material || l.material_name.toLowerCase().includes(f.material.toLowerCase())) &&
    (!f.location || l.location.toLowerCase().includes(f.location.toLowerCase())));
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150));

export const previewApi = {
  getMyProfile: () => delay(previewProfile),
  updateMyProfile: (c: Partial<Profile>) => delay(Object.assign(previewProfile, c)),
  browseListings: (f: ListingFilters) => delay(page(filter(store, f), f)),
  myListings: (f: ListingFilters) => delay(page(filter(store.filter((l) => l.is_owner), f), f)),
  getListing: (id: string) => {
    const l = store.find((x) => x.listing_id === id);
    return l ? delay(l) : Promise.reject(new Error("Listing not found"));
  },
  createListing: (input: ListingInput) => {
    const l: Listing = {
      ...store[0], ...input, listing_id: `p${Date.now()}`, owner_id: "preview-user", is_owner: true, status: "active",
      description: input.description ?? null, expected_price: input.expected_price ?? null, images: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    store = [l, ...store];
    return delay(l);
  },
  updateListing: (id: string, changes: Partial<ListingInput> & { status?: "active" | "cancelled" }) => {
    store = store.map((l) => (l.listing_id === id ? { ...l, ...changes } as Listing : l));
    return previewApi.getListing(id);
  },
  deleteListing: (id: string) => { store = store.filter((l) => l.listing_id !== id); return delay(null); },
  uploadImages: (id: string, _files: File[]) => previewApi.getListing(id),
  removeImage: (id: string, _path: string) => previewApi.getListing(id),
};
