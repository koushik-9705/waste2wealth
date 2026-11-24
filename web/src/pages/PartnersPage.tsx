import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { partners } from "../lib/demo";
import { Icon } from "../components/Icon";
import { Alert } from "../components/ui";
import { PageHeader, DemoBadge } from "../components/widgets";

export function PartnersPage() {
  const [q, setQ] = useState("");
  const list = partners.filter((p) => `${p.name} ${p.location} ${p.materials.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Recycling Partners" subtitle="Verified buyers, recyclers and refurbishers near you" demo
        action={<label className="search-input"><Icon name="search" size={16} /><input placeholder="Search partners or materials" value={q} onChange={(e) => setQ(e.target.value)} /></label>} />
      <div className="partner-grid">
        {list.map((p) => (
          <Link key={p.id} to={`/partners/${p.id}`} className="card partner-card">
            <div className="partner-cover"><Icon name="recycle" size={30} /></div>
            <div className="partner-body">
              <h3>{p.name} {p.verified && <Icon name="shield" size={15} className="verified-ic" />}</h3>
              <p className="rating"><Icon name="star" size={14} /> {p.rating} <span className="muted">({p.reviews} reviews)</span></p>
              <p className="muted small">{p.tagline}</p>
              <p className="small"><Icon name="pin" size={14} /> {p.location}</p>
              <div className="tag-row">{p.materials.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function PartnerDetailPage() {
  const { id } = useParams();
  const p = partners.find((x) => x.id === id) ?? partners[0];
  const [sent, setSent] = useState(false);
  return (
    <div className="partner-detail">
      <Link to="/partners" className="back-link"><Icon name="arrowLeft" size={16} /> Back to Partners</Link>
      <div className="card partner-hero">
        <svg viewBox="0 0 900 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="partner-hero-art">
          <rect width="900" height="220" fill="#d7eefb" />
          <path d="M0 160 Q200 120 450 150 T900 140 V220 H0Z" fill="#8cc97a" />
          <rect x="140" y="70" width="330" height="95" fill="#2e7d4f" /><path d="M130 72 L305 30 L480 72Z" fill="#1f6b42" />
          <rect x="500" y="95" width="230" height="70" fill="#3d8f5f" /><path d="M492 97 L615 62 L738 97Z" fill="#2a7a4d" />
          {[170, 230, 290, 350, 410].map((x) => <rect key={x} x={x} y="110" width="34" height="55" fill="#dfeee4" />)}
          <path d="M40 160c0-40 18-66 40-76 6 34-10 62-40 76zM820 158c0-44 16-72 38-82 6 38-10 68-38 82z" fill="#4fa34a" />
        </svg>
      </div>

      <div className="partner-detail-grid">
        <section className="card panel">
          <div className="pd-title">
            <span className="match-logo"><Icon name="recycle" size={30} /></span>
            <div>
              <h1>{p.name} {p.verified && <span className="verified"><Icon name="shield" size={14} /> Verified Partner</span>}</h1>
              <p className="rating"><Icon name="star" size={15} /> {p.rating} <span className="link-like">({p.reviews} reviews)</span></p>
              <p className="muted">{p.tagline} <DemoBadge /></p>
            </div>
          </div>
          <h3>Accepted Materials</h3>
          <div className="tag-row">{p.materials.map((t) => <span key={t} className="tag tag-lg">{t}</span>)}</div>
          <div className="pd-facts">
            <div><h3>Service Area</h3><p><Icon name="pin" size={15} /> {p.serviceArea}</p></div>
            <div><h3>Capacity</h3><p><Icon name="box" size={15} /> {p.capacity}</p></div>
          </div>
        </section>
        <aside className="card panel pd-side">
          {sent ? <Alert kind="success">Request sent to {p.name}. (Demo - not saved yet.)</Alert>
            : <button className="btn btn-primary btn-block" onClick={() => setSent(true)}>Send Request</button>}
          <button className="btn btn-outline btn-block"><Icon name="phone" size={15} /> Contact</button>
          <h3>About Us</h3>
          <p className="muted small">{p.about}</p>
        </aside>
      </div>
    </div>
  );
}
