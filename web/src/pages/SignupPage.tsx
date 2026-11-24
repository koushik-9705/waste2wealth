import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { friendlyAuthError, supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { Alert } from "../components/ui";
import { BrandMark, Icon } from "../components/Icon";

/** Green illustrated side panel shared by the sign-in and sign-up pages. */
export function AuthAside({ title, text }: { title: string; text: string }) {
  return (
    <div className="auth-aside">
      <div className="brand brand-light"><BrandMark size={30} /><span>Waste2Wealth</span></div>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
        <ul className="auth-points">
          <li><Icon name="check" size={16} strokeWidth={3} /> List waste in under 2 minutes</li>
          <li><Icon name="check" size={16} strokeWidth={3} /> Get matched with verified recyclers</li>
          <li><Icon name="check" size={16} strokeWidth={3} /> Track every pickup end to end</li>
        </ul>
      </div>
      <svg className="auth-art" viewBox="0 0 300 120" aria-hidden="true">
        <path d="M0 120 Q80 60 150 90 T300 70 V120Z" fill="rgba(255,255,255,.12)" />
        <path d="M0 120 Q100 90 190 105 T300 100 V120Z" fill="rgba(124,194,66,.35)" />
        <path d="M230 80c0-22 14-36 38-38-2 24-16 38-38 38z" fill="#7cc242" />
        <path d="M230 80c-4-18-18-28-36-28 2 18 16 28 36 28z" fill="#a5d86b" />
      </svg>
    </div>
  );
}

export function SignupPage() {
  const { session } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // full_name is read by the handle_new_user trigger to create the profile.
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) return setError(friendlyAuthError(error.message));
      if (!data.session) setCheckEmail(true); // email confirmation is enabled
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-split card">
        <AuthAside title="Join the circular economy" text="Farmers, households and recyclers working together to turn waste into value." />
        <div className="auth-form">
          {checkEmail ? (
            <>
              <h1>Check your email</h1>
              <Alert kind="success">
                We sent a confirmation link to <strong>{email}</strong>. Open it, then sign in.
              </Alert>
              <Link to="/login" className="btn btn-primary btn-block">Go to sign in</Link>
            </>
          ) : (
            <>
              <h1>Create your account</h1>
              <p className="muted small">New accounts can list waste right away. Partner (buyer/recycler) accounts are set up after verification.</p>
              {error && <Alert>{error}</Alert>}
              <form className="form" onSubmit={submit}>
                <label className="field">
                  <span>Full name</span>
                  <input required minLength={2} maxLength={120} autoComplete="name" placeholder="Your full name" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" value={password}
                    onChange={(e) => setPassword(e.target.value)} />
                </label>
                <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
              </form>
              <p className="muted small center">Already have an account? <Link to="/login">Sign in</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
