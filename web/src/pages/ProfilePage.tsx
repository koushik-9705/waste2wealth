import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import type { Profile } from "../lib/types";
import { Alert, ErrorMessage } from "../components/ui";

const ROLE_LABEL: Record<Profile["account_type"], string> = {
  generator: "Waste generator",
  partner: "Partner (buyer / recycler)",
  both: "Generator and partner",
  admin: "Administrator",
};

type Editable = Pick<Profile, "full_name" | "phone" | "organization_name" | "address" | "city" | "state" | "pincode">;
const FIELDS: { key: keyof Editable; label: string; type?: string; pattern?: string; hint?: string }[] = [
  { key: "full_name", label: "Full name" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "organization_name", label: "Organization (optional)" },
  { key: "address", label: "Address" },
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
    <div className="narrow">
      <h1>Your profile</h1>
      <div className="card profile-summary">
        <div><span className="muted small">Email</span><div>{session?.user.email}</div></div>
        <div><span className="muted small">Account type</span><div>{ROLE_LABEL[profile.account_type]}</div></div>
      </div>
      {saved && <Alert kind="success">Profile saved.</Alert>}
      <ErrorMessage error={error} />
      <form className="form card" onSubmit={submit}>
        {FIELDS.map(({ key, label, type, pattern, hint }) => (
          <label className="field" key={key}>
            <span>{label}</span>
            <input type={type ?? "text"} pattern={pattern} required={key === "full_name"} value={form[key] ?? ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            {hint && <small className="muted">{hint}</small>}
          </label>
        ))}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  );
}
