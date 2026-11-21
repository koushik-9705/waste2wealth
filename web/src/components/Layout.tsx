import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { canCreateListings, useAuth } from "../auth/AuthProvider";

export function Layout() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>Waste2Wealth</span>
        </NavLink>
        {session && (
          <nav className="nav">
            <NavLink to="/listings">Browse</NavLink>
            {canCreateListings(profile) && <NavLink to="/my-listings">My listings</NavLink>}
            {canCreateListings(profile) && (
              <NavLink to="/listings/new" className="btn btn-primary btn-sm">
                + New listing
              </NavLink>
            )}
            <NavLink to="/profile" className="nav-user" title="Your profile">
              {profile?.full_name ?? "Profile"}
            </NavLink>
            <button
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
            >
              Sign out
            </button>
          </nav>
        )}
      </header>
      <main className="container">
        <Outlet />
      </main>
      <footer className="footer muted">Waste2Wealth · Turning waste into opportunity</footer>
    </div>
  );
}
