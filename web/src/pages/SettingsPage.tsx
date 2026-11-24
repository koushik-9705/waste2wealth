import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/widgets";
import { Icon } from "../components/Icon";

const PREFS = [
  { key: "email", label: "Email me when a partner sends a collection request", def: true },
  { key: "match", label: "Notify me about new AI matches for my listings", def: true },
  { key: "digest", label: "Weekly impact summary", def: false },
];

export function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(Object.fromEntries(PREFS.map((p) => [p.key, p.def])));
  return (
    <div className="narrow-wide">
      <PageHeader title="Settings" subtitle="Notification preferences and account" />
      <section className="card panel">
        <h2>Notifications</h2>
        <p className="muted small">Saved on this device only for now - notification delivery is not built yet.</p>
        <ul className="toggle-list">
          {PREFS.map((p) => (
            <li key={p.key}>
              <span>{p.label}</span>
              <button role="switch" aria-checked={prefs[p.key]} aria-label={p.label}
                className={`switch ${prefs[p.key] ? "on" : ""}`} onClick={() => setPrefs({ ...prefs, [p.key]: !prefs[p.key] })}><i /></button>
            </li>
          ))}
        </ul>
      </section>
      <section className="card panel">
        <h2>Account</h2>
        <ul className="row-list">
          <li><Link to="/profile"><span className="row-icon"><Icon name="profile" size={18} /></span><span className="row-main"><strong>Edit profile</strong><span className="muted small">Name, phone, address</span></span><Icon name="chevronRight" size={16} /></Link></li>
          <li><a href="mailto:support@waste2wealth.example"><span className="row-icon"><Icon name="phone" size={18} /></span><span className="row-main"><strong>Help &amp; Support</strong><span className="muted small">Get in touch with the team</span></span><Icon name="chevronRight" size={16} /></a></li>
        </ul>
      </section>
    </div>
  );
}
