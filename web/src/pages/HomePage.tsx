import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Icon } from "../components/Icon";
import { landingStats, partners } from "../lib/demo";
import { isPreview } from "../lib/preview";

const STEPS = [
  { n: 1, title: "List Your Waste", text: "Share what you have" },
  { n: 2, title: "Find Matches", text: "Connect with buyers" },
  { n: 3, title: "Request Collection", text: "Schedule pickup" },
  { n: 4, title: "Create Impact", text: "Build a greener planet" },
];

const CATEGORIES = [
  { name: "Agricultural residue", text: "Paddy straw, rice husk, coconut coir, bagasse", icon: "leaf" as const },
  { name: "E-waste", text: "Laptops, phones, circuit boards, printers", icon: "box" as const },
  { name: "Plastic & paper", text: "Bottles, cardboard, packaging", icon: "recycle" as const },
];

export function HomePage() {
  const { session, loading } = useAuth();
  if (loading) return <div className="page-center muted">Loading…</div>;
  if (session && !isPreview) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Turn Waste<br /><span>Into Wealth</span></h1>
          <p className="hero-tag">Connect. Recycle. Grow a Greener Tomorrow.</p>
          <p className="hero-lead">A smart marketplace to buy, sell and recycle agricultural and industrial waste.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">Explore Marketplace <Icon name="arrowRight" size={18} /></Link>
            <a href="#how" className="btn btn-outline btn-lg"><Icon name="play" size={18} /> Watch Demo</a>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="stats-strip" aria-label="Platform numbers">
        {landingStats.map((s) => (
          <div key={s.label} className="strip-item">
            <Icon name={s.icon} size={30} />
            <div><strong>{s.value}</strong><span>{s.label}</span></div>
          </div>
        ))}
      </section>

      <section className="how" id="how">
        <h2>How It Works?</h2>
        <p className="muted">A simple 4-step process to create a circular economy</p>
        <div className="how-steps">
          {STEPS.map((s, i) => (
            <div key={s.n} className="how-step">
              <span className="how-num">{s.n}</span>
              <strong>{s.title}</strong>
              <span className="muted small">{s.text}</span>
              {i < STEPS.length - 1 && <Icon name="arrowRight" size={18} className="how-arrow" />}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="marketplace">
        <h2>What you can list</h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="card cat-card">
              <span className="stat-icon"><Icon name={c.icon} size={24} /></span>
              <strong>{c.name}</strong>
              <p className="muted small">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="partners">
        <h2>Trusted recycling partners</h2>
        <div className="cat-grid">
          {partners.slice(0, 3).map((p) => (
            <div key={p.id} className="card cat-card">
              <strong>{p.name} {p.verified && <Icon name="shield" size={16} className="verified-ic" />}</strong>
              <p className="muted small">{p.tagline}</p>
              <span className="small"><Icon name="pin" size={14} /> {p.location}</span>
            </div>
          ))}
        </div>
        <div className="cta-band">
          <div>
            <h3>Ready to turn your waste into wealth?</h3>
            <p>Create a free account and post your first listing in under 2 minutes.</p>
          </div>
          <Link to="/signup" className="btn btn-light btn-lg">Get Started</Link>
        </div>
      </section>
    </>
  );
}

/** Hero illustration: recycling ring around a sapling held in hands, over green fields. */
function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 420 340">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2fbf4" /><stop offset="1" stopColor="#dff2e3" /></linearGradient>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7cc242" /><stop offset="1" stopColor="#1f7a4d" /></linearGradient>
        </defs>
        <rect width="420" height="340" rx="24" fill="url(#sky)" />
        <path d="M0 250 Q110 205 210 235 T420 215 V340 H0Z" fill="#b9e09a" />
        <path d="M0 285 Q140 245 260 275 T420 265 V340 H0Z" fill="#7cc242" />
        <path d="M0 315 Q160 290 300 310 T420 305 V340 H0Z" fill="#4fa34a" />
        <g fill="none" stroke="url(#ring)" strokeWidth="22" strokeLinecap="round">
          <path d="M150 95 A95 95 0 0 1 300 110" />
          <path d="M318 150 A95 95 0 0 1 250 255" />
          <path d="M190 258 A95 95 0 0 1 122 140" />
        </g>
        <g fill="#1f7a4d">
          <path d="M300 92 l22 22 -30 8z" /><path d="M262 270 l-30 4 12-28z" /><path d="M112 150 l-6-30 26 16z" />
        </g>
        <ellipse cx="215" cy="230" rx="62" ry="16" fill="#6b4a2b" />
        <path d="M150 238c20 22 110 22 130 0l14 30c-40 26-118 26-158 0z" fill="#e7b98f" />
        <path d="M215 228v-58" stroke="#2e9e4f" strokeWidth="6" strokeLinecap="round" />
        <path d="M215 190c-30-2-46-20-46-44 26 0 44 16 46 44z" fill="#7cc242" />
        <path d="M215 175c26-4 42-24 40-50-28 2-42 22-40 50z" fill="#2e9e4f" />
        <path d="M342 60c0-14 10-24 26-26-2 16-12 26-26 26z" fill="#7cc242" />
        <path d="M60 80c2-12 12-20 26-20-2 14-12 22-26 20z" fill="#2e9e4f" />
      </svg>
    </div>
  );
}
