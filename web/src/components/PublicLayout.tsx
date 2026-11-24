import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { BrandMark, Icon } from "./Icon";

/** Top navigation for the public pages (landing, login, signup). */
export function PublicLayout() {
  const { session } = useAuth();
  return (
    <div className="public">
      <header className="pub-nav">
        <Link to="/" className="brand">
          <BrandMark size={30} />
          <span>Waste2Wealth</span>
        </Link>
        <nav className="pub-links" aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <a href="/#marketplace">Marketplace</a>
          <a href="/#partners">Partners</a>
          <a href="/#how">About</a>
          <a href="/#how" className="pub-links-more">Resources <Icon name="chevronDown" size={14} /></a>
        </nav>
        <div className="pub-actions">
          <button className="icon-btn" aria-label="Search"><Icon name="search" size={18} /></button>
          {session ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </header>
      <Outlet />
      <footer className="pub-footer">
        <div className="brand"><BrandMark size={24} /><span>Waste2Wealth</span></div>
        <p className="muted small">Connect. Recycle. Grow a greener tomorrow. © {new Date().getFullYear()} Waste2Wealth</p>
      </footer>
    </div>
  );
}
