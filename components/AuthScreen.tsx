"use client";

import Image from "next/image";
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
      <div className="auth-art" aria-hidden="true">
        <Image src="/assets/mobile-hero-hand.png" alt="" fill priority sizes="(max-width: 760px) 100vw, 56vw" draggable={false} />
      </div>
      <p className="auth-margin-note">IDEAS<br />SYSTEMS<br />PEOPLE<br />IMPACT</p>
    </main>
  );
}
