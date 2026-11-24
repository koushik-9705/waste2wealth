import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { friendlyAuthError, supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { Alert } from "../components/ui";
import { AuthAside } from "./SignupPage";

export function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return setError(friendlyAuthError(error.message));
    } catch (err) {
      return setError(friendlyAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-wrap">
      <div className="auth-split card">
        <AuthAside title="Welcome back!" text="Sign in to manage your listings, requests and matches." />
        <div className="auth-form">
          <h1>Sign in</h1>
          <p className="muted">Use the email and password you registered with.</p>
          {error && <Alert>{error}</Alert>}
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span>Email</span>
              <input type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" autoComplete="current-password" required placeholder="Your password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="muted small center">No account yet? <Link to="/signup">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}
