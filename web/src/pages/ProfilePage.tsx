import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import type { Profile } from "../lib/types";
import { Alert, ErrorMessage } from "../components/ui";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/widgets";

const ROLE_LABEL: Record<Profile["account_type"], string> = {
  generator: "Waste generator",
  partner: "Partner (buyer / recycler)",
  both: "Generator and partner",
  admin: "Administrator",
};

type Editable = Pick<Profile, "full_name" | "phone" | "organization_name" | "address" | "city" | "state" | "pincode">;
const FIELDS: { key: keyof Editable; label: string; type?: string; pattern?: string; hint?: string; wide?: boolean }[] = [
  { key: "full_name", label: "Full name" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "organization_name", label: "Organization (optional)", wide: true },
  { key: "address", label: "Address", wide: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "PIN code", pattern: "\\d{6}", hint: "6 digits" },
];

export function ProfilePage() {
  const { session, profile, profileError, refreshProfile } = useAuth();
  const [form, setForm] = useState<Editable | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      const { full_name, phone, organization_name, address, city, state, pincode } = profile;
      setForm({ full_name, phone, organization_name, address, city, state, pincode });
    }
  }, [profile]);

  if (profileError) return <Alert>{profileError}</Alert>;
  if (!profile || !form) return <div className="page-center muted">Loading…</div>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    // Send only changed fields; empty strings become null (except the name).
    const changes: Partial<Profile> = {};
    for (const { key } of FIELDS) {
      const value = (form[key] ?? "").trim();
      const next = value === "" && key !== "full_name" ? null : value;
      if (next !== (profile[key] ?? null)) (changes as Record<string, string | null>)[key] = next;
    }
    try {
      if (Object.keys(changes).length) {
        await api.updateMyProfile(changes);
        await refreshProfile();
      }
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details" />
      <div className="profile-layout">
        <aside className="card profile-card">
          <span className="avatar avatar-xl">{profile.full_name.charAt(0).toUpperCase()}</span>
          <h2>{profile.full_name}</h2>
          <span className="role-pill">{ROLE_LABEL[profile.account_type]}</span>
          <p className="muted small">{session?.user.email}</p>
          {profile.city && <p className="small"><Icon name="pin" size={14} /> {profile.city}{profile.state ? `, ${profile.state}` : ""}</p>}
          <ul className="row-list profile-links">
            <li><Link to="/my-listings"><span className="row-icon"><Icon name="listings" size={17} /></span><span className="row-main"><strong>My Listings</strong></span><Icon name="chevronRight" size={16} /></Link></li>
            <li><Link to="/requests"><span className="row-icon"><Icon name="requests" size={17} /></span><span className="row-main"><strong>My Requests</strong></span><Icon name="chevronRight" size={16} /></Link></li>
            <li><Link to="/settings"><span className="row-icon"><Icon name="settings" size={17} /></span><span className="row-main"><strong>Settings</strong></span><Icon name="chevronRight" size={16} /></Link></li>
          </ul>
        </aside>

        <section className="card panel">
          <h2>Personal details</h2>
          {saved && <Alert kind="success">Profile saved.</Alert>}
          <ErrorMessage error={error} />
          <form className="form form-grid" onSubmit={submit}>
            {FIELDS.map(({ key, label, type, pattern, hint, wide }) => (
              <label className={`field ${wide ? "span-2" : ""}`} key={key}>
                <span>{label}</span>
                <input type={type ?? "text"} pattern={pattern} required={key === "full_name"} value={form[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                {hint && <small className="muted">{hint}</small>}
              </label>
            ))}
            <div className="span-2">
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
