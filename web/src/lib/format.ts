import type { ListingStatus, WasteCategory } from "./types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export const formatPrice = (v: string | null) => (v === null ? "Price on request" : inr.format(Number(v)));
export const formatQuantity = (q: string, unit: string) => `${num.format(Number(q))} ${unit}`;
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const categoryLabel: Record<WasteCategory, string> = {
  agricultural: "Agricultural residue",
  electronic: "E-waste",
};

export const statusLabel: Record<ListingStatus, string> = {
  active: "Active",
  reserved: "Reserved",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** "₹12/kg" when both price and quantity are known, otherwise null. */
export const pricePerUnit = (l: { expected_price: string | null; quantity: string; unit: string }) => {
  if (l.expected_price === null) return null;
  const q = Number(l.quantity);
  if (!q) return null;
  return `${inr.format(Math.round(Number(l.expected_price) / q))}/${l.unit}`;
};
