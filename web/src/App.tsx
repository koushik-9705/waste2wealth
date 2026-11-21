import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { Layout } from "./components/Layout";
import { Alert } from "./components/ui";
import { configError } from "./lib/supabase";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ProfilePage } from "./pages/ProfilePage";
import { BrowsePage } from "./pages/BrowsePage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { NewListingPage } from "./pages/NewListingPage";
import { EditListingPage } from "./pages/EditListingPage";
import { MyListingsPage } from "./pages/MyListingsPage";

export default function App() {
  if (configError) {
    return <div className="container"><Alert>{configError}</Alert></div>;
  }
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route element={<RequireAuth />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="listings" element={<BrowsePage />} />
              <Route path="listings/new" element={<NewListingPage />} />
              <Route path="listings/:id" element={<ListingDetailPage />} />
              <Route path="listings/:id/edit" element={<EditListingPage />} />
              <Route path="my-listings" element={<MyListingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
