import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, FAMILY_EMAIL } from "../lib/supabase";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="min-h-screen" />;
  if (!session) return <PasswordScreen />;
  return <>{children}</>;
}

function PasswordScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: FAMILY_EMAIL,
      password,
    });
    setBusy(false);
    if (error) {
      setError("That password didn't work. Try again.");
      setPassword("");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-[var(--radius-card)] border border-ring bg-gradient-to-b from-card-2 to-card p-7 shadow-2xl shadow-black/40"
      >
        <div className="mb-5 text-center">
          <div className="text-4xl" aria-hidden="true">
            🌸
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold text-heading">
            Family Lists
          </h1>
          <p className="mt-1 text-sm text-muted">
            Enter the family password to open the lists.
          </p>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Family password"
          aria-label="Family password"
          className="w-full rounded-xl border border-ring bg-black/20 px-4 py-3 text-center text-item outline-none transition focus:border-ring-strong"
        />
        {error && (
          <p className="mt-3 text-center text-sm text-rose-300">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Opening…" : "Open lists"}
        </button>
      </form>
    </main>
  );
}
