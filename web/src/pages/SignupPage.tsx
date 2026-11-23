import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { friendlyAuthError, supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { Alert } from "../components/ui";

export function SignupPage() {
  const { session } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/listings" replace />;

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

  if (checkEmail) {
    return (
      <div className="auth-card card">
        <h1>Check your email</h1>
        <Alert kind="success">
          We sent a confirmation link to <strong>{email}</strong>. Open it, then sign in.
        </Alert>
        <Link to="/login" className="btn btn-primary">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="auth-card card">
      <h1>Create your account</h1>
      <p className="muted small">New accounts can list waste right away. Partner (buyer/recycler) accounts are set up after verification.</p>
      {error && <Alert>{error}</Alert>}
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Full name</span>
          <input required minLength={2} maxLength={120} autoComplete="name" value={fullName}
            onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="new-password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)} />
          <small className="muted">At least 8 characters.</small>
        </label>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="muted small">Already have an account? <Link to="/login">Sign in</Link></p>
    </div>
  );
}
