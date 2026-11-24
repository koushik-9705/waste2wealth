import { Link, useParams } from "react-router-dom";
import { admin, demoListings, partners, requests } from "../lib/demo";
import { Icon } from "../components/Icon";
import { BarChart, PageHeader, StatCard, DemoBadge } from "../components/widgets";
import { formatQuantity } from "../lib/format";

/**
 * Admin console UI. All data here is demo data: the admin API does not exist yet.
 * Real access control must be enforced by the backend (require_roles("admin") + RLS) -
 * hiding links in the UI is not authorization.
 */
export function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" demo
        action={<button className="btn btn-outline btn-sm"><Icon name="calendar" size={15} /> Last 30 Days <Icon name="chevronDown" size={14} /></button>} />
      <div className="stat-grid">
        {admin.stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} change={s.change} icon={s.icon} />)}
      </div>
      <div className="two-col wide-left">
        <section className="card panel">
          <div className="panel-head"><h2>Monthly Growth</h2></div>
          <BarChart labels={admin.growth.labels} series={[
            { name: "Users (K)", values: admin.growth.users, color: "#1f7a4d" },
            { name: "Listings (K)", values: admin.growth.listings, color: "#a5d86b" },
          ]} />
        </section>
        <section className="card panel">
          <div className="panel-head">
            <h2>Verification Queue</h2>
            <Link to="/admin/partners" className="link-more">View All <Icon name="arrowRight" size={15} /></Link>
          </div>
          <ul className="queue">
            {admin.queue.map((q) => (
              <li key={q.title + q.detail}>
                <span className={`row-icon ${q.kind === "flag" ? "warn" : ""}`}><Icon name={q.kind === "flag" ? "flag" : "users"} size={17} /></span>
                <span className="row-main"><strong>{q.title}</strong><span className="muted small">{q.detail}</span></span>
                <button className="btn btn-soft btn-sm">Review</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card panel">
        <div className="panel-head"><h2>Recent sign-ups</h2><Link to="/admin/users" className="link-more">All users <Icon name="arrowRight" size={15} /></Link></div>
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>City</th><th>Joined</th></tr></thead>
          <tbody>{admin.recentUsers.map((u) => <tr key={u.name}><td>{u.name}</td><td>{u.role}</td><td>{u.city}</td><td className="muted">{u.joined}</td></tr>)}</tbody>
        </table>
      </section>
    </>
  );
}

const SECTIONS: Record<string, { title: string; subtitle: string; head: string[]; rows: string[][] }> = {
  users: {
    title: "Users", subtitle: "Manage farmers, partners and admins",
    head: ["Name", "Role", "City", "Joined"],
    rows: admin.recentUsers.map((u) => [u.name, u.role, u.city, u.joined]),
  },
  listings: {
    title: "Listings", subtitle: "Moderate waste listings",
    head: ["Material", "Quantity", "Location", "Status"],
    rows: demoListings.map((l) => [l.material_name, formatQuantity(l.quantity, l.unit), l.location, l.status]),
  },
  partners: {
    title: "Partners", subtitle: "Verify and manage recycling partners",
    head: ["Partner", "Location", "Rating", "Verification"],
    rows: partners.map((p) => [p.name, p.location, String(p.rating), p.verified ? "Verified" : "Pending"]),
  },
  requests: {
    title: "Requests", subtitle: "Monitor collection requests across the platform",
    head: ["ID", "Material", "Partner", "Status"],
    rows: requests.map((r) => [r.id, `${r.material} · ${r.quantity}`, r.partner, r.status]),
  },
  reports: {
    title: "Reports", subtitle: "Download platform reports",
    head: ["Report", "Period", "Format"],
    rows: [["Monthly recycling summary", "Jun 2026", "CSV"], ["Partner verification log", "Q2 2026", "CSV"], ["Listings by category", "Jun 2026", "CSV"]],
  },
};

export function AdminSectionPage() {
  const { section = "users" } = useParams();
  const s = SECTIONS[section] ?? SECTIONS.users;
  return (
    <>
      <PageHeader title={s.title} subtitle={s.subtitle} demo />
      <section className="card panel">
        <table className="table">
          <thead><tr>{s.head.map((h) => <th key={h}>{h}</th>)}<th /></tr></thead>
          <tbody>
            {s.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => <td key={j}>{["Verified", "Pending", "active", "Completed", "Scheduled", "Accepted", "reserved", "completed"].includes(c)
                  ? <span className={`pill pill-${c.toLowerCase()}`}>{c}</span> : c}</td>)}
                <td className="right"><button className="btn btn-soft btn-sm">{section === "reports" ? "Download" : "View"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small"><DemoBadge /> Actions are not connected yet.</p>
      </section>
    </>
  );
}
