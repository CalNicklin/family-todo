import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!url || !key) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Check your .env.local.",
  );
}

// The whole family signs in to one shared account; the session is kept in this
// device's localStorage so they only type the password once.
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Hardcoded shared account — only the password is ever entered by a person.
export const FAMILY_EMAIL =
  (import.meta.env.VITE_FAMILY_EMAIL as string) || "family@todo.local";
