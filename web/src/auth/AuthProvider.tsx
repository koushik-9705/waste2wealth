import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import type { Profile } from "../lib/types";
import { isPreview, previewProfile } from "../lib/preview";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const lastUserId = useRef<string | null>(null);

  const loadProfile = useCallback(async (s: Session | null) => {
    lastUserId.current = s?.user.id ?? null;
    if (!s) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await api.getMyProfile());
      setProfileError(null);
    } catch (e) {
      setProfile(null);
      setProfileError(e instanceof Error ? e.message : "Could not load your profile");
    }
  }, []);

  useEffect(() => {
    if (isPreview) {
      // Dev-only preview: pretend a demo user is signed in.
      setSession({ user: { id: previewProfile.user_id, email: "keerthi@example.com" } } as unknown as Session);
      setProfile(previewProfile);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      // Pages only need the session to render; the profile loads in the background.
      setLoading(false);
      void loadProfile(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Token refreshes don't change the profile; only reload on sign-in/out.
      // (The initial session is handled by getSession above.)
      if (event === "SIGNED_OUT" || event === "USER_UPDATED" || (event === "SIGNED_IN" && s?.user.id !== lastUserId.current)) {
        // Defer so we don't call Supabase inside its own callback.
        setTimeout(() => void loadProfile(s), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthState = {
    session,
    profile,
    loading,
    profileError,
    refreshProfile: () => loadProfile(session),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** generator and both accounts can create listings (mirrors the backend rule). */
export const canCreateListings = (p: Profile | null) =>
  !!p && (p.account_type === "generator" || p.account_type === "both");
