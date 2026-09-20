"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthScreen({ authError = false }: { authError?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(authError ? "Sign-in did not finish. Please try again." : "");

  const signIn = async () => {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage("Google sign-in is not available yet. Ask an ASC administrator for help.");
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-wordmark"><b>ASC</b><span>Club Portal<small>closed member portal</small></span></div>
      <section className="auth-copy">
        <p className="eyebrow">AUTOMATED SYSTEMS CLUB</p>
        <h1>Build.<br />Learn.<br />Belong.</h1>
        <p>One private place for club members, workshops and the projects we build together.</p>
        <button className="auth-button" type="button" onClick={signIn} disabled={loading}>
          <span className="google-mark" aria-hidden="true">G</span>
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>
        {message ? <p className="auth-message" role="alert">{message}</p> : null}
        <small>New members can complete an application after signing in. Access is approved by an ASC administrator.</small>
        <nav className="auth-legal" aria-label="Legal information">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </section>
      <aside className="auth-system" aria-hidden="true">
        <div className="auth-system-index"><span>ASC / 2026</span><span>MEMBER ACCESS</span></div>
        <div className="auth-system-mark">A<span>S</span>C</div>
        <ol>
          <li><span>01</span><strong>Verify identity</strong><small>Google account</small></li>
          <li><span>02</span><strong>Complete profile</strong><small>Club application</small></li>
          <li><span>03</span><strong>Build together</strong><small>Member portal</small></li>
        </ol>
        <p>IDEAS · SYSTEMS · PEOPLE · IMPACT</p>
      </aside>
    </main>
  );
}
