import { Link } from "react-router-dom";
import { matches, partners } from "../lib/demo";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/widgets";

export function MatchesPage() {
  const best = matches[0];
  const bestPartner = partners.find((p) => p.id === best.partnerId)!;
  return (
    <>
      <PageHeader title="AI Matching Results" subtitle="Here are the best matches for your waste" demo />

      <div className="smart-banner">
        <Icon name="sparkles" size={22} />
        <div>
          <strong>Smart Match</strong>
          <span>You'll get {best.score}% match with {bestPartner.name}!</span>
        </div>
        <Link to={`/partners/${bestPartner.id}`} className="btn btn-light btn-sm">View Details <Icon name="arrowRight" size={15} /></Link>
      </div>

      <div className="match-list">
        {matches.map((m) => {
          const p = partners.find((x) => x.id === m.partnerId)!;
          return (
            <article key={m.partnerId} className="card match-card">
              <span className="match-logo"><Icon name="recycle" size={34} /></span>
              <div className="match-info">
                <h3>{p.name} {p.verified && <span className="verified"><Icon name="shield" size={14} /> Verified</span>}</h3>
                <p className="muted small">{p.tagline}</p>
                <p className="small"><Icon name="pin" size={14} /> {p.location}</p>
                <div className="tag-row">{p.materials.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}<span className="tag">Eco-Friendly</span></div>
                <p className="match-reason"><Icon name="sparkles" size={14} /> {m.reason}</p>
              </div>
              <div className="match-side">
                <span className="score-ring" style={{ ["--p" as string]: m.score }}><span>{m.score}%<small>Match</small></span></span>
                <div className="match-actions">
                  <Link to={`/partners/${p.id}`} className="btn btn-outline btn-sm">Contact Partner</Link>
                  <Link to="/requests" className="btn btn-primary btn-sm">Request Collection</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="muted small">Scores combine material compatibility, quantity range, distance and partner verification. AI suggestions are informational.</p>
    </>
  );
}
