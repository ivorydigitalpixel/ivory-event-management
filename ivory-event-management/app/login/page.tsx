"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [message, setMessage] = useState("");

  async function submit() {
    const supabase = createClient();
    setMessage("");
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) return setMessage(error.message);
    if (mode === "up") return setMessage("Check your email to confirm your account, then sign in.");
    window.location.href = "/dashboard";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold text-navy">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <input className="rounded border p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="rounded border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={submit} className="rounded bg-navy p-2 text-ivory">{mode === "in" ? "Sign in" : "Sign up"}</button>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-sm text-gold">
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
      {message && <p className="text-sm">{message}</p>}
    </main>
  );
}
