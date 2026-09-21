"use client";

import { useState, useTransition } from "react";
import { saveProfileAction, signOutAction } from "@/app/actions";
import type { Direction, Level, ProfileInput, ProfileStatus } from "@/data/types";
import type { AccountProfile } from "@/lib/portal-data";
import { AvailabilityPicker } from "./AvailabilityPicker";

const directions: Direction[] = ["Machine Learning", "Arduino", "Programming", "Both", "Not sure"];
const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];

export function OnboardingScreen({ profile }: { profile: AccountProfile }) {
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
  const [pending, startTransition] = useTransition();
  const isSuspended = profile.status === "suspended";

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await saveProfileAction(draft);
      setMessage(result.ok
        ? profile.status === "active" ? "Profile saved. Opening the portal…" : "Application saved. An administrator can now review it."
        : result.message);
      if (result.ok && profile.status === "active") window.location.reload();
    });
  };

  if (isSuspended) {
    return <main className="gate-page"><section className="gate-message"><p className="eyebrow">ASC / ACCESS</p><h1>Access paused.</h1><p>Your club portal access is currently suspended. Contact an ASC administrator if you think this is a mistake.</p><form action={signOutAction}><button className="text-link">Sign out</button></form></section></main>;
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
