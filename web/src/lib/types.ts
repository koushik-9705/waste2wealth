export type AccountType = "generator" | "partner" | "both" | "admin";
export type WasteCategory = "agricultural" | "electronic";
export type ListingStatus = "active" | "reserved" | "completed" | "cancelled";
export type Unit = "kg" | "tonne" | "piece" | "litre";
export type SortBy = "newest" | "oldest" | "quantity_asc" | "quantity_desc" | "price_asc" | "price_desc";

export interface Profile {
  user_id: string;
  full_name: string;
  phone: string | null;
  account_type: AccountType;
  organization_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  path: string;
  url: string | null;
}

export interface Listing {
  listing_id: string;
  owner_id: string;
  waste_category: WasteCategory;
  material_name: string;
  description: string | null;
  quantity: string;
  unit: Unit;
  material_condition: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  expected_price: string | null;
  status: ListingStatus;
  images: ListingImage[];
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ListingInput {
  waste_category: WasteCategory;
  material_name: string;
  description?: string | null;
  quantity: string;
  unit: Unit;
  material_condition: string;
  location: string;
  expected_price?: string | null;
}

export interface ListingFilters {
  category?: WasteCategory | "";
  material?: string;
  location?: string;
  status?: ListingStatus | "";
  sort_by?: SortBy;
  page?: number;
  page_size?: number;
}
