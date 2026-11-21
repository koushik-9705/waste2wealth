import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

function checkConfig(): string | null {
  if (!url || !anonKey) {
    return "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy web/.env.example to web/.env.local, fill in the values and restart `npm run dev`.";
  }
  if (url.includes("your-project-ref") || anonKey.startsWith("your_")) {
    return "web/.env.local still has the placeholder values from .env.example. Put in the real Project URL and anon key (Supabase → Project Settings → API Keys) and restart `npm run dev`.";
  }
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) {
    return `VITE_SUPABASE_URL looks wrong ("${url}"). It should look like https://abcdefgh.supabase.co (no /rest/v1 or other path).`;
  }
  if (anonKey.split(".").length !== 3 && !anonKey.startsWith("sb_publishable_")) {
    return "VITE_SUPABASE_ANON_KEY doesn't look like a Supabase anon/publishable key. Copy it again from Project Settings → API Keys.";
  }
  return null;
}

export const configError = checkConfig();

// Supabase handles sign-up, sign-in and token refresh. All app data goes through our API.
export const supabase = createClient(url || "http://localhost", anonKey || "missing", {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** Turn low-level auth errors into something a user can act on. */
export function friendlyAuthError(message: string): string {
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return "Can't reach Supabase. Check your internet connection, turn off ad/tracker blockers for this site, and make sure VITE_SUPABASE_URL in web/.env.local is correct.";
  }
  if (message === "Email not confirmed") {
    return "Please confirm your email first - check your inbox for the link.";
  }
  if (message === "Invalid login credentials") {
    return "Wrong email or password.";
  }
  return message;
}
