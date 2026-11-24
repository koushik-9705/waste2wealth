/** Small inline-SVG icon set (stroke icons, 24x24 grid). No external icon library needed. */
const PATHS = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  listings: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  requests: "M4 4h16v12H5.2L4 17.2zM8 9h8M8 12h5",
  matches: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  partners: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  analytics: "M3 3v18h18M7 15l4-4 3 3 5-6",
  profile: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3",
  leaf: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10M2 21c0-3 1.9-5.4 5.1-6.1",
  recycle: "M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7l3.9-6.7M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1M14 16l-3 3 3 3M8.3 13.6 7.2 9.5 3.1 10.6M9.3 5.6l1.1-1.9a1.8 1.8 0 0 1 3.1 0l3.9 6.7M13.4 7.6l4.1 1.1 1.1-4.1",
  truck: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  check: "M20 6 9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  chevronDown: "m6 9 6 6 6-6",
  chevronRight: "m9 18 6-6-6-6",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10",
  star: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10M9 12l2 2 4-4",
  play: "M10 8l6 4-6 4zM12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
  handshake: "m11 17 2 2a1 1 0 1 0 3-3M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.9l.5.3a2 2 0 0 0 1.4.3L21 4M21 3l1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8",
  sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4M5 17v4M7 19H3",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  report: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  image: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-5-5L5 21",
  x: "M18 6 6 18M6 6l12 12",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  box: "M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7zM3.3 7 12 12l8.7-5M12 22V12",
  trendUp: "M22 7l-8.5 8.5-5-5L2 17M16 7h6v6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className, strokeWidth = 2 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The Waste2Wealth leaf mark used in the sidebar and navbar. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 35C10 35 5 27 7 15c9 0 15 5 15 13" fill="#7cc242" />
      <path d="M20 35c10 0 15-9 13-22-11 0-17 7-16 17" fill="#2e9e4f" />
      <path d="M20 35c0-8 3-14 9-18" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
