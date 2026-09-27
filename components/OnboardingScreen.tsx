"use client";

import { useState, useTransition } from "react";
import { saveProfileAction, signOutAction } from "@/app/actions";
import type { Direction, Level, ProfileInput, ProfileStatus } from "@/data/types";
import type { AccountProfile } from "@/lib/portal-data";
import { AvailabilityPicker } from "./AvailabilityPicker";

const directions: Direction[] = ["Machine Learning", "Arduino", "Programming", "Both", "Not sure"];
const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];

export function OnboardingScreen({ profile, profileComplete }: { profile: AccountProfile; profileComplete: boolean }) {
  const [draft, setDraft] = useState<ProfileInput>({
    firstName: profile.first_name,
    lastName: profile.last_name,
    grade: profile.grade ?? 10,
    direction: profile.direction ?? "Not sure",
    level: profile.level ?? "Beginner",
    skills: profile.skills,
    competitionInterest: profile.competition_interest,
    availabilityDays: profile.availability_days,
    bio: profile.bio,
    email: profile.email,
    whatsapp: profile.whatsapp,
  });
  const [message, setMessage] = useState("");
  const [applicationSaved, setApplicationSaved] = useState(profile.status === "pending" && profileComplete);
  const [pending, startTransition] = useTransition();
  const isSuspended = profile.status === "suspended";

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await saveProfileAction(draft);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      if (profile.status === "active") {
        window.location.reload();
        return;
      }
      setApplicationSaved(true);
    });
  };

  if (isSuspended) {
    return <main className="gate-page"><section className="gate-message"><p className="eyebrow">ASC / ACCESS</p><h1>Access paused.</h1><p>Your club portal access is currently suspended. Contact an ASC administrator if you think this is a mistake.</p><form action={signOutAction}><button className="text-link">Sign out</button></form></section></main>;
  }

  if (applicationSaved) {
    return (
      <main className="gate-page">
        <header className="gate-header"><b>ASC</b><span>MEMBER REGISTRATION</span><form action={signOutAction}><button type="submit">Sign out</button></form></header>
        <section className="gate-message gate-confirmation">
          <p className="eyebrow">ASC / APPLICATION RECEIVED</p>
          <h1>Application<br />saved.</h1>
          <p>Your profile is complete and waiting for an ASC administrator to approve your membership. The members, events and projects pages will open after approval.</p>
          <div className="gate-status"><span className="orange-dot" aria-hidden="true" /> Awaiting approval</div>
          <p>You do not need to register again. Return to this page after approval to enter the club portal.</p>
          <div className="gate-confirmation-actions">
            <a className="button" href="/">Check access</a>
            <button className="text-link" type="button" onClick={() => setApplicationSaved(false)}>Edit application</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="gate-page">
      <header className="gate-header"><b>ASC</b><span>MEMBER REGISTRATION</span><form action={signOutAction}><button type="submit">Sign out</button></form></header>
      <section className="gate-intro">
        <p className="eyebrow">{profile.status === "active" ? "COMPLETE YOUR PROFILE" : "APPLICATION / PENDING APPROVAL"}</p>
        <h1>{profile.status === "active" ? "One last step." : "Tell us about you."}</h1>
        <p>{profile.status === "active" ? "Complete your member profile before entering the portal." : "Your Google account is verified. Fill in your club profile; an administrator will approve access."}</p>
      </section>
      <form className="gate-form" onSubmit={submit}>
        <div className="form-grid">
          <label>First name<input required value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} /></label>
          <label>Last name<input required value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} /></label>
          <label>Grade<select value={draft.grade} onChange={(event) => setDraft({ ...draft, grade: Number(event.target.value) })}>{[7,8,9,10,11,12].map((grade) => <option key={grade}>{grade}</option>)}</select></label>
          <label>Direction<select value={draft.direction} onChange={(event) => setDraft({ ...draft, direction: event.target.value as Direction })}>{directions.map((direction) => <option key={direction}>{direction}</option>)}</select></label>
          <label>Experience<select value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value as Level })}>{levels.map((level) => <option key={level}>{level}</option>)}</select></label>
          <label className="checkbox-label"><input type="checkbox" checked={draft.competitionInterest} onChange={(event) => setDraft({ ...draft, competitionInterest: event.target.checked })} /> Interested in competitions</label>
          <label className="wide">Short bio<textarea rows={3} maxLength={500} value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} /></label>
          <label className="wide">Skills <small>Separate with commas</small><input value={draft.skills.join(", ")} onChange={(event) => setDraft({ ...draft, skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) })} /></label>
          <AvailabilityPicker value={draft.availabilityDays} onChange={(availabilityDays) => setDraft({ ...draft, availabilityDays })} />
          <label>Email<input required type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
          <label>WhatsApp<input value={draft.whatsapp} onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value })} /></label>
        </div>
        <div className="gate-actions"><button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save application"}</button>{message ? <p role="status">{message}</p> : null}</div>
      </form>
    </main>
  );
}
