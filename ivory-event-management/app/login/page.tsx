"use client";
import { useState, useEffect, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth/redirect";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const supabase = createClient();
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      if (mode === "up") {
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("next", next);
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password, options: { emailRedirectTo: callback.toString() },
        });
        if (error) { setMessage(error.message); return; }
        if (!data.session) { setMessage("Check your email to confirm your account, then sign in."); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) { setMessage(error.message); return; }
      }
      window.location.assign(next);
    } catch { setMessage("Unable to connect. Please try again."); }
    finally { setPending(false); }
  }

  async function resendConfirmation() {
    if (pending) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage("Enter your email address first."); return; }
    setPending(true);
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      const { error } = await createClient().auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: callback.toString() } });
      setMessage(error ? error.message : "If your account needs confirmation, a new email has been requested.");
    } catch { setMessage("Unable to connect. Please try again."); }
    finally { setPending(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold text-navy">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" autoComplete="email" required className="rounded border p-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={mode === "up" ? 8 : undefined} className="rounded border p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={pending} className="rounded bg-navy p-2 text-ivory disabled:opacity-50">{pending ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</button>
      </form>
      <button disabled={pending} onClick={() => { setMode(mode === "in" ? "up" : "in"); setMessage(""); }} className="text-sm text-gold">
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
      {message && <p role="status" className="text-sm">{message}</p>}
      <ConfirmationError />
      <button type="button" disabled={pending} onClick={resendConfirmation} className="text-sm text-gold">Resend confirmation email</button>
    </main>
  );
}

function ConfirmationError() {
  // Read the browser URL after mounting so static rendering does not need it.
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(new URLSearchParams(window.location.search).get("error") === "confirmation"); }, []);
  return failed ? <p role="alert" className="text-sm">This confirmation link is invalid or expired. Enter your email and request a new confirmation email.</p> : null;
}
