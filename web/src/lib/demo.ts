/**
 * DEMO DATA - placeholder content for screens whose backend does not exist yet
 * (dashboard stats, AI matches, partners, collection requests, analytics, admin).
 *
 * Every screen that uses this file shows a "Demo data" badge. Replace each export
 * with a real API call once the matching backend route is built (see docs/API_Design.md).
 */
import type { Listing } from "./types";

export const demoUser = { name: "Keerthi Shree", role: "Farmer", city: "Ballari, KA" };

export const dashboardStats = [
  { key: "listings", label: "My Listings", value: "5", change: "+12%", icon: "leaf" as const },
  { key: "requests", label: "Requests", value: "3", change: "+20%", icon: "handshake" as const },
  { key: "recycled", label: "Waste Recycled", value: "125 kg", change: "+18%", icon: "recycle" as const },
  { key: "co2", label: "CO₂ Saved", value: "312 kg", change: "+25%", icon: "globe" as const },
];

export const activitySeries = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  listings: [12, 38, 52, 71, 96, 140],
  requests: [5, 20, 31, 44, 63, 92],
};

export const landingStats = [
  { value: "10K+", label: "Active Users", icon: "leaf" as const },
  { value: "50K+", label: "Tons Recycled", icon: "recycle" as const },
  { value: "500+", label: "Partners", icon: "handshake" as const },
  { value: "100+", label: "Cities", icon: "globe" as const },
];

export interface DemoPartner {
  id: string;
  name: string;
  tagline: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  materials: string[];
  serviceArea: string;
  capacity: string;
  about: string;
}

export const partners: DemoPartner[] = [
  {
    id: "greencycle",
    name: "GreenCycle Solutions",
    tagline: "Recycling partner specializing in plastic and paper waste.",
    location: "Ballari, Karnataka",
    rating: 4.8,
    reviews: 124,
    verified: true,
    materials: ["Plastic", "Paper", "Metal", "Glass"],
    serviceArea: "Ballari, Karnataka + 50 km",
    capacity: "500 kg/day",
    about: "We are committed to building a cleaner and greener India through responsible recycling and waste management.",
  },
  {
    id: "agrofibre",
    name: "AgroFibre Industries",
    tagline: "Turns paddy straw and coir into boards and mulch.",
    location: "Guntur, Andhra Pradesh",
    rating: 4.6,
    reviews: 88,
    verified: true,
    materials: ["Paddy straw", "Rice husk", "Coconut coir"],
    serviceArea: "Guntur + 80 km",
    capacity: "2 tonnes/day",
    about: "We buy agricultural residue directly from farmers so it is reused instead of burned.",
  },
  {
    id: "ecircuit",
    name: "eCircuit Recyclers",
    tagline: "Certified e-waste dismantling and refurbishing.",
    location: "Hyderabad, Telangana",
    rating: 4.5,
    reviews: 61,
    verified: true,
    materials: ["Laptops", "Mobile phones", "Circuit boards"],
    serviceArea: "Hyderabad + 40 km",
    capacity: "300 units/day",
    about: "Authorised e-waste recycler. Data on devices is wiped before refurbishing or dismantling.",
  },
  {
    id: "bioharvest",
    name: "BioHarvest Compost",
    tagline: "Organic waste into compost for local farms.",
    location: "Mysuru, Karnataka",
    rating: 4.3,
    reviews: 37,
    verified: false,
    materials: ["Organic", "Sugarcane bagasse"],
    serviceArea: "Mysuru + 30 km",
    capacity: "1 tonne/day",
    about: "A small composting unit supplying organic manure to farmers in the region.",
  },
];

export const matches = [
  { partnerId: "greencycle", score: 95, reason: "Accepts plastic and paper, within 12 km, verified, has capacity for 500 kg/day." },
  { partnerId: "ecircuit", score: 81, reason: "Verified, accepts mixed scrap, 38 km away." },
  { partnerId: "bioharvest", score: 64, reason: "Nearby, but not yet verified and mainly accepts organic waste." },
];

export type RequestStep = { label: string; at: string | null; done: boolean };
export interface DemoRequest {
  id: string;
  material: string;
  quantity: string;
  partner: string;
  status: "Pending" | "Accepted" | "Scheduled" | "Collected" | "Completed" | "Rejected";
  updated: string;
  steps: RequestStep[];
}

const steps = (n: number): RequestStep[] =>
  [
    { label: "Request Submitted", at: "14 Nov, 10:30 AM" },
    { label: "Accepted by Partner", at: "14 Nov, 11:15 AM" },
    { label: "Pickup Scheduled", at: "15 Nov, 09:00 AM" },
    { label: "Waste Collected", at: "15 Nov, 12:40 PM" },
    { label: "Completed", at: "15 Nov, 01:10 PM" },
  ].map((s, i) => ({ label: s.label, at: i < n ? s.at : null, done: i < n }));

export const requests: DemoRequest[] = [
  { id: "REQ-1042", material: "Plastic Bottles", quantity: "50 kg", partner: "GreenCycle Solutions", status: "Scheduled", updated: "15 Nov", steps: steps(3) },
  { id: "REQ-1039", material: "Paddy Straw", quantity: "2 tonne", partner: "AgroFibre Industries", status: "Accepted", updated: "14 Nov", steps: steps(2) },
  { id: "REQ-1031", material: "Old Laptops", quantity: "12 piece", partner: "eCircuit Recyclers", status: "Completed", updated: "9 Nov", steps: steps(5) },
  { id: "REQ-1027", material: "Cardboard Boxes", quantity: "200 kg", partner: "GreenCycle Solutions", status: "Pending", updated: "8 Nov", steps: steps(1) },
];

export const analytics = {
  monthlyRecycled: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], values: [40, 55, 48, 70, 92, 125] },
  byMaterial: [
    { label: "Plastic", value: 42 },
    { label: "Paper", value: 28 },
    { label: "Agricultural", value: 18 },
    { label: "E-waste", value: 12 },
  ],
};

export const admin = {
  stats: [
    { label: "Total Users", value: "12.5K", change: "+12%", icon: "users" as const },
    { label: "Listings", value: "8.2K", change: "+15%", icon: "listings" as const },
    { label: "Requests", value: "3.1K", change: "+10%", icon: "requests" as const },
    { label: "Waste Recycled", value: "420 T", change: "+20%", icon: "recycle" as const },
  ],
  growth: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    users: [6.2, 7.4, 8.1, 9.6, 11.0, 12.5],
    listings: [3.9, 4.8, 5.6, 6.4, 7.3, 8.2],
  },
  queue: [
    { title: "New Partner Registration", detail: "Green Earth Recycling", kind: "partner" as const },
    { title: "New Listing Flagged", detail: "Plastic Waste - 500 kg", kind: "flag" as const },
    { title: "Verification Documents", detail: "eCircuit Recyclers - GST certificate", kind: "partner" as const },
  ],
  recentUsers: [
    { name: "Ravi Kumar", role: "Farmer", city: "Guntur", joined: "2 days ago" },
    { name: "Green Earth Recycling", role: "Partner", city: "Bengaluru", joined: "3 days ago" },
    { name: "Anitha R", role: "Farmer", city: "Ballari", joined: "5 days ago" },
  ],
};

/** Demo listings, used only in UI preview mode (no backend). Same shape as the real API. */
const now = new Date().toISOString();
const listing = (
  id: string, material: string, cat: Listing["waste_category"], qty: string, unit: Listing["unit"],
  price: string | null, location: string, condition: string, status: Listing["status"] = "active", owner = false,
): Listing => ({
  listing_id: id, owner_id: owner ? "preview-user" : "someone-else", waste_category: cat, material_name: material,
  description: `${material} available for collection. Stored dry and ready for pickup.`, quantity: qty, unit,
  material_condition: condition, location, latitude: null, longitude: null, expected_price: price, status,
  images: [], is_owner: owner, created_at: now, updated_at: now,
});

export const demoListings: Listing[] = [
  listing("d1", "Sugarcane Bagasse", "agricultural", "800", "kg", "2400", "Ballari, KA", "Sun-dried", "active", true),
  listing("d2", "Old Mobile Phones", "electronic", "35", "piece", "5250", "Ballari, KA", "Mixed, some working", "active", true),
  listing("d3", "Old Printers", "electronic", "8", "piece", "2400", "Ballari, KA", "Not working"),
  listing("d4", "Paddy Straw", "agricultural", "2", "tonne", "4000", "Guntur, AP", "Dry, baled"),
  listing("d5", "Old Laptops", "electronic", "12", "piece", null, "Hyderabad, TS", "Not working, for parts", "reserved", true),
  listing("d6", "Coconut Coir", "agricultural", "500", "kg", "2500", "Mysuru, KA", "Sun-dried"),
  listing("d7", "Rice Husk", "agricultural", "1", "tonne", "1800", "Raichur, KA", "Dry, bagged", "completed", true),
  listing("d8", "Circuit Boards", "electronic", "40", "kg", "3200", "Bengaluru, KA", "Removed from devices"),
];
