import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { BrandMark, Icon, type IconName } from "./Icon";
import { isPreview } from "../lib/preview";

type NavItem = { to: string; label: string; icon: IconName; end?: boolean };

const USER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/listings", label: "Marketplace", icon: "box", end: true },
  { to: "/my-listings", label: "My Listings", icon: "listings" },
  { to: "/requests", label: "Requests", icon: "requests" },
  { to: "/matches", label: "Matches", icon: "matches" },
  { to: "/partners", label: "Partners", icon: "partners" },
  { to: "/analytics", label: "Analytics", icon: "analytics" },
  { to: "/profile", label: "Profile", icon: "profile" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/users", label: "Users", icon: "users" },
  { to: "/admin/listings", label: "Listings", icon: "listings" },
  { to: "/admin/partners", label: "Partners", icon: "partners" },
  { to: "/admin/requests", label: "Requests", icon: "requests" },
  { to: "/admin/reports", label: "Reports", icon: "report" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

/** Signed-in shell: green sidebar + top bar (matches the dashboard mockup). */
export function AppLayout({ variant = "user" }: { variant?: "user" | "admin" }) {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nav = variant === "admin" ? ADMIN_NAV : USER_NAV;
  const name = profile?.full_name ?? session?.user.email ?? "You";
  const first = name.split(" ")[0];
  const showAdmin = isPreview || profile?.account_type === "admin";

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to={variant === "admin" ? "/admin" : "/dashboard"} className="brand brand-light">
          <BrandMark size={30} />
          <span>Waste2Wealth</span>
        </Link>
        <nav className="side-nav" aria-label={variant === "admin" ? "Admin" : "App"}>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <Icon name={n.icon} size={18} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-promo">
          <strong>{variant === "admin" ? "Together for a Greener Planet" : "Go Green Together"}</strong>
          <Icon name="leaf" size={18} />
          <svg className="side-promo-art" viewBox="0 0 120 60" aria-hidden="true">
            <path d="M0 60 Q30 30 60 45 T120 35 V60Z" fill="rgba(255,255,255,.12)" />
            <path d="M80 50c0-12 8-20 22-22-2 14-10 22-22 22z" fill="rgba(124,194,66,.55)" />
          </svg>
        </div>
      </aside>

      <div className="shell-main">
        <header className="appbar">
          <label className="appbar-search">
            <Icon name="search" size={17} />
            <input placeholder="Search for waste materials..." aria-label="Search for waste materials"
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/listings?material=${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`);
              }} />
          </label>
          <div className="appbar-right">
            {variant === "user" && (
              <Link to="/listings/new" className="btn btn-primary btn-sm"><Icon name="plus" size={16} /> New listing</Link>
            )}
            <button className="icon-btn" aria-label="Notifications">
              <Icon name="bell" size={19} />
              <span className="dot" />
            </button>
            <div className="user-menu" ref={menuRef}>
              <button className="user-chip" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
                <span className="avatar">{first.charAt(0).toUpperCase()}</span>
                <span>{first}</span>
                <Icon name="chevronDown" size={15} />
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  <Link to="/profile" role="menuitem" onClick={() => setMenuOpen(false)}><Icon name="profile" size={16} /> Profile</Link>
                  {variant === "user"
                    ? showAdmin && <Link to="/admin" role="menuitem" onClick={() => setMenuOpen(false)}><Icon name="shield" size={16} /> Admin console</Link>
                    : <Link to="/dashboard" role="menuitem" onClick={() => setMenuOpen(false)}><Icon name="dashboard" size={16} /> User dashboard</Link>}
                  <button role="menuitem" onClick={async () => { await signOut(); navigate("/login"); }}>
                    <Icon name="logout" size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
