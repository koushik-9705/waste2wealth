import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { PublicLayout } from "./components/PublicLayout";
import { AppLayout } from "./components/AppLayout";
import { Alert } from "./components/ui";
import { configError } from "./lib/supabase";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { BrowsePage } from "./pages/BrowsePage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { NewListingPage } from "./pages/NewListingPage";
import { EditListingPage } from "./pages/EditListingPage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { MatchesPage } from "./pages/MatchesPage";
import { PartnerDetailPage, PartnersPage } from "./pages/PartnersPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminDashboardPage, AdminSectionPage } from "./pages/AdminPages";

export default function App() {
  if (configError) {
    return <div className="container"><Alert>{configError}</Alert></div>;
  }
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="listings" element={<BrowsePage />} />
              <Route path="listings/new" element={<NewListingPage />} />
              <Route path="listings/:id" element={<ListingDetailPage />} />
              <Route path="listings/:id/edit" element={<EditListingPage />} />
              <Route path="my-listings" element={<MyListingsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="partners/:id" element={<PartnerDetailPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            {/* Admin UI (demo data). The backend must enforce the admin role for any real admin API. */}
            <Route path="admin" element={<AppLayout variant="admin" />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path=":section" element={<AdminSectionPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
