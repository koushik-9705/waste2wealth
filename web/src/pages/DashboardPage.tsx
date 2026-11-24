import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import type { Listing } from "../lib/types";
import { activitySeries, dashboardStats, requests } from "../lib/demo";
import { formatQuantity } from "../lib/format";
import { Icon } from "../components/Icon";
import { DemoBadge, LineChart, StatCard } from "../components/widgets";
import { StatusBadge } from "../components/ui";

export function DashboardPage() {
  const { profile } = useAuth();
  const [mine, setMine] = useState<{ total: number; items: Listing[] } | null>(null);

  useEffect(() => {
    api.myListings({ page_size: 4 }).then((d) => setMine({ total: d.total, items: d.items })).catch(() => setMine(null));
  }, []);

  const first = (profile?.full_name ?? "there").split(" ")[0];
  const stats = dashboardStats.map((s) => (s.key === "listings" && mine ? { ...s, value: String(mine.total), change: undefined } : s));

  return (
    <div className="dash">
      <div className="welcome">
        <h1>Welcome Back, {first}!</h1>
        <p className="muted">Together for a sustainable future <Icon name="leaf" size={16} className="leaf-ic" /></p>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <div className="stat-grid">
            {stats.map((s) => <StatCard key={s.key} label={s.label} value={s.value} change={s.change} icon={s.icon} />)}
          </div>
          <section className="card panel">
            <div className="panel-head">
              <h2>Your Activity Overview <DemoBadge /></h2>
            </div>
            <LineChart labels={activitySeries.labels} series={[
              { name: "Listings", values: activitySeries.listings, color: "#1f7a4d" },
              { name: "Requests", values: activitySeries.requests, color: "#7cc242" },
            ]} />
          </section>
        </div>

        <aside className="impact-card">
          <h2>Your Impact</h2>
          <span>This Month</span>
          <svg viewBox="0 0 160 160" className="impact-globe" aria-hidden="true">
            <circle cx="80" cy="80" r="60" fill="#3aa0d8" />
            <path d="M45 50c18-8 30 4 28 18s14 12 10 26-22 8-24 22c-12-8-24-36-14-66zM96 32c12 4 22 14 26 26-10 2-16-6-24-4s-10-14-2-22zM104 96c10-6 22-2 20 10-4 14-20 20-26 16 2-8-2-20 6-26z" fill="#7cc242" />
            <path d="M120 40c0-14 10-24 26-26-2 16-12 26-26 26z" fill="#2e9e4f" />
            <path d="M28 120c-2-12 6-22 20-24 0 14-8 24-20 24z" fill="#a5d86b" />
          </svg>
          <strong className="impact-value">125 kg</strong>
          <span>Waste Recycled</span>
          <span className="impact-co2"><Icon name="globe" size={14} /> 312 kg CO₂ Saved</span>
          <DemoBadge />
        </aside>
      </div>

      <div className="two-col">
        <section className="card panel">
          <div className="panel-head">
            <h2>Recent listings</h2>
            <Link to="/my-listings" className="link-more">View all <Icon name="arrowRight" size={15} /></Link>
          </div>
          {mine && mine.items.length > 0 ? (
            <ul className="row-list">
              {mine.items.map((l) => (
                <li key={l.listing_id}>
                  <Link to={`/listings/${l.listing_id}`}>
                    <span className="row-icon"><Icon name={l.waste_category === "agricultural" ? "leaf" : "box"} size={18} /></span>
                    <span className="row-main"><strong>{l.material_name}</strong><span className="muted small">{formatQuantity(l.quantity, l.unit)} · {l.location}</span></span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-mini">
              <p className="muted">You haven't listed anything yet.</p>
              <Link to="/listings/new" className="btn btn-primary btn-sm"><Icon name="plus" size={16} /> Create listing</Link>
            </div>
          )}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h2>Recent requests <DemoBadge /></h2>
            <Link to="/requests" className="link-more">View all <Icon name="arrowRight" size={15} /></Link>
          </div>
          <ul className="row-list">
            {requests.slice(0, 4).map((r) => (
              <li key={r.id}>
                <Link to={`/requests?id=${r.id}`}>
                  <span className="row-icon"><Icon name="truck" size={18} /></span>
                  <span className="row-main"><strong>{r.material} · {r.quantity}</strong><span className="muted small">{r.partner}</span></span>
                  <span className={`pill pill-${r.status.toLowerCase()}`}>{r.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
