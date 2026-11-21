import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function HomePage() {
  const { session, loading } = useAuth();
  if (loading) return <div className="page-center muted">Loading…</div>;
  if (session) return <Navigate to="/listings" replace />;

  return (
    <section className="hero">
      <h1>Waste has value. Let's find who needs it.</h1>
      <p className="lead">
        List agricultural residue or old electronics, and connect with buyers, recyclers and
        refurbishers - instead of burning or dumping it.
      </p>
      <div className="hero-actions">
        <Link to="/signup" className="btn btn-primary">Create an account</Link>
        <Link to="/login" className="btn btn-ghost">Sign in</Link>
      </div>
      <div className="steps">
        <div className="step"><strong>1. List</strong><span>Material, quantity, condition, location and photos.</span></div>
        <div className="step"><strong>2. Match</strong><span>Verified partners discover listings that fit what they accept.</span></div>
        <div className="step"><strong>3. Track</strong><span>Accept a request, schedule collection, follow it to completion.</span></div>
      </div>
    </section>
  );
}
