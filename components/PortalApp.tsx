"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { saveEventAction, saveProfileAction, setEventInterestAction, setRsvpAction, signOutAction, updateMemberAccessAction } from "@/app/actions";
import type { Announcement, ClubEvent, Direction, EventAttendee, EventInput, EventInterest, EventStatus, EventType, Level, Member, ProfileInput, ProfileStatus, Role } from "@/data/types";
import type { PortalState } from "@/lib/portal-data";
import { AvailabilityPicker } from "./AvailabilityPicker";
import { Icon } from "./Icons";

type Page = "home" | "events" | "members" | "profile" | "admin";

const nav: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "members", label: "Members", icon: "users" },
  { id: "profile", label: "Profile", icon: "user" },
  { id: "admin", label: "Dashboard", icon: "admin" },
];

const canViewPrivateContacts = (viewer: Member) => viewer.role === "organizer" || viewer.role === "admin";

const formatDate = (date: string, style: "full" | "month" | "day" = "full") => {
  const value = new Date(`${date}T12:00:00`);
  if (style === "month") return value.toLocaleDateString("en", { month: "short" }).toUpperCase();
  if (style === "day") return value.toLocaleDateString("en", { day: "2-digit" });
  return value.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
};

function Initials({ member, large = false }: { member: Member; large?: boolean }) {
  return <span className={`avatar ${large ? "avatar-large" : ""}`}>{member.firstName[0]}{member.lastName[0]}</span>;
}

function ActionButton({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return <button className={`button ${active ? "button-active" : ""}`} onClick={onClick}>{active && <Icon name="check" />}<span>{children}</span></button>;
}

export function PortalApp({ initialState }: { initialState: PortalState }) {
  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<Member>(initialState.user);
  const [events, setEvents] = useState<ClubEvent[]>(initialState.events);
  const [rsvps, setRsvps] = useState<string[]>(initialState.rsvps);
  const [interestEventIds, setInterestEventIds] = useState<string[]>(initialState.interestEventIds);
  const [eventInterests, setEventInterests] = useState<EventInterest[]>(initialState.eventInterests);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (next: Page) => {
    setPage(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleRsvp = async (eventId: string) => {
    const attending = !rsvps.includes(eventId);
    setRsvps((current) => attending ? [...current, eventId] : current.filter((id) => id !== eventId));
    const result = await setRsvpAction(eventId, attending);
    if (!result.ok) {
      setRsvps((current) => attending ? current.filter((id) => id !== eventId) : [...current, eventId]);
    }
  };

  const toggleInterest = async (eventId: string) => {
    const interested = !interestEventIds.includes(eventId);
    const ownInterest: EventInterest = { eventId, userId: user.id, name: `${user.firstName} ${user.lastName}`, ascId: user.ascId, grade: user.grade, direction: user.direction, skills: user.skills };
    setInterestEventIds((current) => interested ? [...current, eventId] : current.filter((id) => id !== eventId));
    setEventInterests((current) => interested ? [...current.filter((item) => !(item.eventId === eventId && item.userId === user.id)), ownInterest] : current.filter((item) => !(item.eventId === eventId && item.userId === user.id)));
    const result = await setEventInterestAction(eventId, interested);
    if (!result.ok) {
      setInterestEventIds((current) => interested ? current.filter((id) => id !== eventId) : [...current, eventId]);
      setEventInterests((current) => interested ? current.filter((item) => !(item.eventId === eventId && item.userId === user.id)) : [...current, ownInterest]);
    }
  };

  const visibleNav = nav.filter((item) => item.id !== "admin" || user.role !== "member");

  return (
    <div className="app-shell">
      <Header page={page} items={visibleNav} onNavigate={navigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main key={page} className="page-enter">
        {page === "home" && <HomePage user={user} events={events} members={initialState.members} announcements={initialState.announcements} rsvps={rsvps} interestEventIds={interestEventIds} eventInterests={eventInterests} onRsvp={toggleRsvp} onInterest={toggleInterest} onNavigate={navigate} />}
        {page === "events" && <EventsPage events={events} rsvps={rsvps} interestEventIds={interestEventIds} eventInterests={eventInterests} onRsvp={toggleRsvp} onInterest={toggleInterest} />}
        {page === "members" && <MembersPage viewer={user} members={initialState.members} />}
        {page === "profile" && <ProfilePage user={user} onSave={setUser} />}
        {page === "admin" && <AdminPage members={initialState.adminMembers} viewer={user} events={events} attendees={initialState.eventAttendees} interests={eventInterests} onEventsChange={setEvents} />}
      </main>
      <MobileNav page={page} items={visibleNav} onNavigate={navigate} />
      <footer className="site-footer">
        <div><strong>ASC</strong> <span>Automated Systems Club</span></div>
        <p>Students today. A brighter tomorrow.</p>
      </footer>
    </div>
  );
}

function Header({ page, items, onNavigate, menuOpen, setMenuOpen }: { page: Page; items: typeof nav; onNavigate: (page: Page) => void; menuOpen: boolean; setMenuOpen: (value: boolean) => void }) {
  return (
    <header className="site-header">
      <button className="wordmark" onClick={() => onNavigate("home")} aria-label="Go home"><b>ASC</b><span>Club Portal<small>closed member portal</small></span></button>
      <nav className={`desktop-nav ${menuOpen ? "nav-open" : ""}`} aria-label="Main navigation">
        {items.map((item) => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => onNavigate(item.id)}>{item.label}</button>)}
      </nav>
      <div className="header-mantra">BUILD&nbsp;&nbsp;·&nbsp;&nbsp;LEARN&nbsp;&nbsp;·&nbsp;&nbsp;BELONG</div>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Icon name={menuOpen ? "close" : "menu"} /></button>
    </header>
  );
}

function MobileNav({ page, items, onNavigate }: { page: Page; items: typeof nav; onNavigate: (page: Page) => void }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation">{items.map((item) => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>;
}

function HomePage({ user, events, members, announcements, rsvps, interestEventIds, eventInterests, onRsvp, onInterest, onNavigate }: { user: Member; events: ClubEvent[]; members: Member[]; announcements: Announcement[]; rsvps: string[]; interestEventIds: string[]; eventInterests: EventInterest[]; onRsvp: (id: string) => void; onInterest: (id: string) => void; onNavigate: (page: Page) => void }) {
  const nextEvent = events.find((event) => event.status === "upcoming");
  const attending = nextEvent ? rsvps.includes(nextEvent.id) : false;
  const interested = nextEvent ? interestEventIds.includes(nextEvent.id) : false;
  const interestedCount = nextEvent ? eventInterests.filter((interest) => interest.eventId === nextEvent.id).length : 0;

  return (
    <div>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">ASC / MEMBER PORTAL</p>
          <h1>Good to see you,<br />{user.firstName}.</h1>
          <p className="hero-intro">Your place for the next build, the people behind it, and what the club is making now.</p>
          <button className="text-link" onClick={() => onNavigate("events")}>See what’s happening <Icon name="arrow" /></button>
        </div>
        <div className="hero-plate" aria-label="Technical illustration of a robotic hand and microcontroller" onContextMenu={(event) => event.preventDefault()}>
          <Image className="hero-art hero-art-desktop" src="/assets/robot-hand-board-light.png" alt="Ink-style robotic hand reaching toward a microcontroller" fill preload draggable={false} sizes="(max-width: 800px) 100vw, 58vw" />
          <Image className="hero-art hero-art-mobile" src="/assets/mobile-hero-hand.png" alt="Ink-style open robotic hand" fill preload draggable={false} sizes="(max-width: 760px) 100vw, 1px" />
          <span className="plate-label">IDEAS<br />HARDWARE<br />PEOPLE<br />A BRIGHTER<br />TOMORROW</span>
        </div>
      </section>

      {nextEvent ? <section className="feature-event">
        <div className="event-copy">
          <p className="eyebrow light">NEXT EVENT</p>
          <h2>{nextEvent.title}</h2>
          <div className="event-meta"><span><Icon name="calendar" />{formatDate(nextEvent.date)}</span><span><Icon name="clock" />{nextEvent.startTime} — {nextEvent.endTime}</span><span><Icon name="pin" />{nextEvent.location}</span></div>
          <p>{nextEvent.description}</p>
          {nextEvent.eventType === "competition" && nextEvent.externalUrl ? <a className="event-source-link light" href={nextEvent.externalUrl} target="_blank" rel="noreferrer">Competition website <Icon name="arrow" /></a> : null}
          <div className="event-actions">{nextEvent.eventType === "competition" ? <ActionButton active={interested} onClick={() => onInterest(nextEvent.id)}>{interested ? "Interested" : "I’m interested"}</ActionButton> : <ActionButton active={attending} onClick={() => onRsvp(nextEvent.id)}>{attending ? "I’m attending" : "Join meeting"}</ActionButton>}<span>{nextEvent.eventType === "competition" ? `${interestedCount} looking for a team` : `${nextEvent.attendeeCount + (attending ? 1 : 0)} members going`}</span></div>
        </div>
        <div className="event-art" onContextMenu={(event) => event.preventDefault()}><Image src="/assets/asc-rover.png" alt="Ink-style autonomous rover" fill loading="eager" draggable={false} sizes="(max-width: 800px) 100vw, 45vw" /></div>
        <div className="margin-note">SMALL<br />COMPONENTS<br />BIG<br />POSSIBILITIES</div>
      </section> : <section className="feature-event feature-empty"><div className="event-copy"><p className="eyebrow light">NEXT EVENT</p><h2>Nothing scheduled yet.</h2><p>New workshops and build sessions will appear here as soon as an organizer publishes them.</p></div><div className="event-art" onContextMenu={(event) => event.preventDefault()}><Image src="/assets/asc-rover.png" alt="Ink-style autonomous rover" fill loading="eager" draggable={false} sizes="(max-width: 800px) 100vw, 45vw" /></div></section>}

      <section className="quick-section">
        <div className="section-heading"><p className="eyebrow">QUICK ACCESS</p><p className="section-caption">Four places. No clutter.</p></div>
        <div className="quick-grid">
          {[
            ["events", "calendar", "Events", "Upcoming sessions and RSVP"],
            ["members", "users", "Members", "Find people and shared interests"],
            ["profile", "user", "Your profile", "Keep your club details current"],
            ["admin", "admin", "Organizer tools", "Member database and filters"],
          ].filter(([id]) => id !== "admin" || user.role !== "member").map(([id, icon, title, copy]) => (
            <button key={id} onClick={() => onNavigate(id as Page)} className="quick-link"><Icon name={icon} /><strong>{title}</strong><span>{copy}</span><Icon name="arrow" className="quick-arrow" /></button>
          ))}
        </div>
      </section>

      <section className="home-bottom">
        <div className="announcements">
          <div className="section-heading"><p className="eyebrow">ANNOUNCEMENTS</p><span>{announcements.length} CURRENT</span></div>
          {announcements.length === 0 ? <div className="empty-state"><strong>No announcements yet.</strong><span>Club updates will appear here.</span></div> : null}
          {announcements.map((item) => <article key={item.id} className="announcement-row"><span className="orange-dot" /><div><h3>{item.title}</h3><p>{item.body}</p></div><time>{formatDate(item.createdAt)}</time></article>)}
        </div>
        <div className="club-note">
          <p className="eyebrow">THE CLUB, RIGHT NOW</p>
          <strong>{members.length}</strong>
          <span>members learning,<br />testing and building together.</span>
          <div className="rule-art"><i /><i /><i /><i /></div>
        </div>
      </section>
    </div>
  );
}

function EventsPage({ events, rsvps, interestEventIds, eventInterests, onRsvp, onInterest }: { events: ClubEvent[]; rsvps: string[]; interestEventIds: string[]; eventInterests: EventInterest[]; onRsvp: (id: string) => void; onInterest: (id: string) => void }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [expandedCompetition, setExpandedCompetition] = useState<string | null>(null);
  const visible = events.filter((event) => event.status === tab);
  return (
    <div className="content-page">
      <header className="page-header"><div><p className="eyebrow">PROGRAM / 2026</p><h1>Events</h1></div><p>Workshops, talks and focused build sessions. Join what moves your work forward.</p></header>
      <div className="tab-bar"><button className={tab === "upcoming" ? "active" : ""} onClick={() => setTab("upcoming")}>Upcoming <sup>{events.filter(e => e.status === "upcoming").length}</sup></button><button className={tab === "past" ? "active" : ""} onClick={() => setTab("past")}>Past <sup>{events.filter(e => e.status === "past").length}</sup></button></div>
      <div className="event-list">
        {visible.length === 0 ? <div className="empty-state"><strong>No {tab} events.</strong><span>Organizers will publish the schedule here.</span></div> : null}
        {visible.map((event, index) => {
          const attending = rsvps.includes(event.id);
          const interested = interestEventIds.includes(event.id);
          const interestedMembers = eventInterests.filter((interest) => interest.eventId === event.id);
          const teamOpen = expandedCompetition === event.id;
          return <article className="event-row" key={event.id} style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}>
            <div className="event-date"><span>{formatDate(event.date, "month")}</span><strong>{formatDate(event.date, "day")}</strong></div>
            <div className="event-info"><p className="event-category">{event.eventType === "competition" ? "Competition" : event.category}</p><h2>{event.title}</h2><p>{event.description}</p>{event.eventType === "competition" && event.externalUrl ? <a className="event-source-link" href={event.externalUrl} target="_blank" rel="noreferrer">Official competition page <Icon name="arrow" /></a> : null}</div>
            <div className="event-details"><span><Icon name="clock" />{event.startTime} — {event.endTime}</span><span><Icon name="pin" />{event.location}</span>{event.eventType === "competition" ? <><small>{interestedMembers.length} interested</small><button className="team-toggle" type="button" onClick={() => setExpandedCompetition(teamOpen ? null : event.id)} aria-expanded={teamOpen}>{teamOpen ? "Hide people" : "Find teammates"}</button></> : <small>{event.attendeeCount + (attending ? 1 : 0)} attending</small>}</div>
            {tab === "upcoming" ? event.eventType === "competition" ? <ActionButton active={interested} onClick={() => onInterest(event.id)}>{interested ? "Interested" : "I’m interested"}</ActionButton> : <ActionButton active={attending} onClick={() => onRsvp(event.id)}>{attending ? "Going" : "Join"}</ActionButton> : <span className="past-label">COMPLETED</span>}
            {event.eventType === "competition" && teamOpen ? <div className="competition-team"><p className="eyebrow">INTERESTED MEMBERS / FIND A TEAM</p>{interestedMembers.length ? interestedMembers.map((member) => <div key={member.userId}><strong>{member.name}</strong><span>{member.ascId} · Grade {member.grade}</span><span>{member.direction}</span><small>{member.skills.slice(0, 3).join(" · ") || "Skills not added"}</small></div>) : <p>No one has marked interest yet. You can be first.</p>}</div> : null}
          </article>;
        })}
      </div>
    </div>
  );
}

function MembersPage({ viewer, members }: { viewer: Member; members: Member[] }) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("All");
  const [direction, setDirection] = useState<Direction | "All">("All");
  const [level, setLevel] = useState<Level | "All">("All");
  const [selected, setSelected] = useState<Member | null>(null);
  const visibleMembers = useMemo(() => members.filter((member) => {
    const normalizedQuery = query.trim().toLowerCase();
    const haystack = `${member.firstName} ${member.lastName} ${member.skills.join(" ")}`.toLowerCase();
    return (!normalizedQuery || haystack.includes(normalizedQuery))
      && (grade === "All" || member.grade === Number(grade))
      && (direction === "All" || member.direction === direction)
      && (level === "All" || member.level === level);
  }), [members, query, grade, direction, level]);

  return (
    <div className="content-page members-page">
      <header className="page-header"><div><p className="eyebrow">CLUB DIRECTORY</p><h1>Members</h1></div><p>A community of builders, thinkers and doers. Find someone who knows the thing you want to learn.</p></header>
      <div className="filter-bar">
        <label className="search-field"><Icon name="search" /><input aria-label="Search members" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or skill…" /></label>
        <label><span>Grade</span><select value={grade} onChange={(e) => setGrade(e.target.value)}><option>All</option>{[7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label>
        <label><span>Direction</span><select value={direction} onChange={(e) => setDirection(e.target.value as Direction | "All")}><option>All</option><option>Machine Learning</option><option>Arduino</option><option>Programming</option><option>Both</option><option>Not sure</option></select></label>
        <label><span>Level</span><select value={level} onChange={(e) => setLevel(e.target.value as Level | "All")}><option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
      </div>
      <div className="results-line"><span>{visibleMembers.length} MEMBERS FOUND</span><i /></div>
      <div className="member-list">
        {visibleMembers.length === 0 ? <div className="empty-state"><strong>No matching members.</strong><span>Try changing the filters.</span></div> : null}
        {visibleMembers.map((member, index) => <button className="member-row" key={member.id} onClick={() => setSelected(member)} style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}><Initials member={member} /><div className="member-name"><strong>{member.firstName} {member.lastName}</strong><span>{member.ascId}</span></div><span className="member-grade">Grade {member.grade}</span><span className="member-direction">{member.direction}</span><span className="member-level">{member.level}</span><div className="member-skills">{member.skills.slice(0, 2).map(skill => <i key={skill}>{skill}</i>)}</div><Icon name="arrow" /></button>)}
      </div>
      {selected && <MemberDrawer member={selected} viewer={viewer} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MemberDrawer({ member, viewer, onClose }: { member: Member; viewer: Member; onClose: () => void }) {
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="member-drawer" role="dialog" aria-modal="true" aria-labelledby="member-drawer-title" onMouseDown={(e) => e.stopPropagation()}><button className="drawer-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button><p className="eyebrow">MEMBER PROFILE</p><div className="drawer-identity"><Initials member={member} large /><div><h2 id="member-drawer-title">{member.firstName}<br />{member.lastName}</h2><p>{member.ascId} · Grade {member.grade}</p></div></div><p className="member-bio">{member.bio}</p><dl className="profile-facts"><div><dt>Direction</dt><dd>{member.direction}</dd></div><div><dt>Experience</dt><dd>{member.level}</dd></div><div><dt>Competitions</dt><dd>{member.competitionInterest ? "Interested" : "Not currently"}</dd></div></dl><div className="skills-block"><p className="eyebrow">SKILLS / INTERESTS</p><div>{member.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div>{canViewPrivateContacts(viewer) && <div className="private-block"><p className="eyebrow">ORGANIZER VIEW · PRIVATE</p><a href={`mailto:${member.email}`}>{member.email}</a><span>{member.whatsapp}</span></div>}<p className="privacy-note">Private contact details are {canViewPrivateContacts(viewer) ? "visible because you are an organizer." : "not shared with members."}</p></aside></div>;
}

function ProfilePage({ user, onSave }: { user: Member; onSave: (member: Member) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError("");
    const input: ProfileInput = draft;
    startTransition(async () => {
      const result = await saveProfileAction(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSave(draft); setEditing(false); setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    });
  };

  return <div className="content-page profile-page">
    <header className="profile-hero"><div className="profile-main"><p className="eyebrow">YOUR CLUB PROFILE · {user.ascId}</p><h1>{draft.firstName}<br />{draft.lastName}</h1><p>{draft.bio}</p></div><Initials member={draft} large /><button className="button profile-edit" onClick={() => setEditing(!editing)}><Icon name={editing ? "close" : "edit"}/><span>{editing ? "Cancel" : "Edit profile"}</span></button></header>
    {saved && <div className="saved-toast"><Icon name="check" /> Profile updated</div>}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {editing ? <ProfileForm draft={draft} setDraft={setDraft} onSave={save} pending={pending} /> : <div className="profile-layout"><dl className="profile-details"><div><dt>Grade</dt><dd>{draft.grade}</dd></div><div><dt>Direction</dt><dd>{draft.direction}</dd></div><div><dt>Experience</dt><dd>{draft.level}</dd></div><div><dt>Competition interest</dt><dd>{draft.competitionInterest ? "Yes — contact me" : "Not right now"}</dd></div><div><dt>Meeting days</dt><dd>{draft.availabilityDays.length ? draft.availabilityDays.map((day) => day.slice(0, 3)).join(" · ") : "Not selected"}</dd></div></dl><div className="profile-side"><div className="skills-block"><p className="eyebrow">SKILLS / INTERESTS</p><div>{draft.skills.length ? draft.skills.map(skill => <span key={skill}>{skill}</span>) : <span>Not added yet</span>}</div></div><div className="profile-contact"><p className="eyebrow">PRIVATE CONTACT</p><p>{draft.email}<br />{draft.whatsapp || "No WhatsApp number"}</p><small>Contact details and meeting availability are visible only to organizers and admins.</small><form action={signOutAction}><button className="text-link profile-signout" type="submit">Sign out <Icon name="arrow" /></button></form></div></div></div>}
    <div className="profile-quote"><span>“</span><p>Build small.<br />Test honestly.<br />Share what works.</p></div>
  </div>;
}

function ProfileForm({ draft, setDraft, onSave, pending }: { draft: Member; setDraft: (member: Member) => void; onSave: () => void; pending: boolean }) {
  const update = (key: keyof Member, value: Member[keyof Member]) => setDraft({ ...draft, [key]: value });
  return <form className="profile-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}><div className="form-grid"><label>First name<input required value={draft.firstName} onChange={e => update("firstName", e.target.value)} /></label><label>Last name<input required value={draft.lastName} onChange={e => update("lastName", e.target.value)} /></label><label>Grade<select value={draft.grade} onChange={e => update("grade", Number(e.target.value))}>{[7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label><label>Direction<select value={draft.direction} onChange={e => update("direction", e.target.value as Direction)}><option>Machine Learning</option><option>Arduino</option><option>Programming</option><option>Both</option><option>Not sure</option></select></label><label>Experience<select value={draft.level} onChange={e => update("level", e.target.value as Level)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label className="checkbox-label"><input type="checkbox" checked={draft.competitionInterest} onChange={e => update("competitionInterest", e.target.checked)} /> Interested in competitions</label><label className="wide">Short bio<textarea maxLength={500} value={draft.bio} onChange={e => update("bio", e.target.value)} rows={3} /></label><label className="wide">Skills <small>Separate with commas</small><input value={draft.skills.join(", ")} onChange={e => update("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} /></label><AvailabilityPicker value={draft.availabilityDays} onChange={(availabilityDays) => update("availabilityDays", availabilityDays)} /><label>Email<input required type="email" value={draft.email} onChange={e => update("email", e.target.value)} /></label><label>WhatsApp<input value={draft.whatsapp} onChange={e => update("whatsapp", e.target.value)} /></label></div><button className="button form-save" type="submit" disabled={pending}><span>{pending ? "Saving…" : "Save changes"}</span><Icon name="arrow" /></button></form>;
}

function newEventDraft(): EventInput {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return { title: "", date, startTime: "16:00", endTime: "18:00", location: "", description: "", status: "upcoming", category: "Workshop", eventType: "meeting", externalUrl: "" };
}

function AdminPage({ members: initialMembers, viewer, events, attendees, interests, onEventsChange }: { members: Member[]; viewer: Member; events: ClubEvent[]; attendees: EventAttendee[]; interests: EventInterest[]; onEventsChange: (events: ClubEvent[]) => void }) {
  const [workspace, setWorkspace] = useState<"events" | "members">("events");
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("All");
  const [direction, setDirection] = useState<Direction | "All">("All");
  const [level, setLevel] = useState<Level | "All">("All");
  const [competitionOnly, setCompetitionOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [eventDraft, setEventDraft] = useState<EventInput | null>(null);
  const [eventMessage, setEventMessage] = useState("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [eventPending, startEventTransition] = useTransition();
  const filtered = useMemo(() => members.filter(member => `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase().includes(query.toLowerCase()) && (grade === "All" || (member.profileComplete && member.grade === Number(grade))) && (direction === "All" || (member.profileComplete && member.direction === direction)) && (level === "All" || (member.profileComplete && member.level === level)) && (!competitionOnly || member.competitionInterest)), [members, query, grade, direction, level, competitionOnly]);
  const orderedEvents = useMemo(() => [...events].sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`)), [events]);

  const updateAccess = (member: Member, role: Role, status: ProfileStatus) => {
    setMessage("");
    startTransition(async () => {
      const result = await updateMemberAccessAction(member.id, role, status);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role, status } : item));
      setMessage(`Access updated for ${member.firstName || member.email}.`);
    });
  };

  const saveEvent = (input: EventInput) => {
    setEventMessage("");
    startEventTransition(async () => {
      const result = await saveEventAction(input);
      if (!result.ok) {
        setEventMessage(result.message);
        return;
      }
      const nextEvents = events.some((event) => event.id === result.event.id)
        ? events.map((event) => event.id === result.event.id ? result.event : event)
        : [...events, result.event];
      onEventsChange(nextEvents);
      setEventDraft(null);
      setEventMessage(input.id ? "Event updated." : "Event published.");
    });
  };

  const changeEventStatus = (event: ClubEvent, status: EventStatus) => saveEvent({
    id: event.id,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    description: event.description,
    category: event.category,
    eventType: event.eventType,
    externalUrl: event.externalUrl,
    status,
  });

  const editEvent = (event: ClubEvent) => {
    setEventMessage("");
    setEventDraft({ id: event.id, title: event.title, date: event.date, startTime: event.startTime, endTime: event.endTime, location: event.location, description: event.description, status: event.status, category: event.category, eventType: event.eventType, externalUrl: event.externalUrl });
  };

  return <div className="content-page admin-page">
    <header className="page-header"><div><p className="eyebrow">ORGANIZER WORKSPACE</p><h1>Club dashboard</h1></div><p>Publish events, review attendance and manage the member directory from one workspace.</p></header>
    <div className="workspace-tabs" role="tablist" aria-label="Dashboard sections"><button role="tab" aria-selected={workspace === "events"} className={workspace === "events" ? "active" : ""} onClick={() => setWorkspace("events")}>Events <sup>{events.length}</sup></button><button role="tab" aria-selected={workspace === "members"} className={workspace === "members" ? "active" : ""} onClick={() => setWorkspace("members")}>Members <sup>{members.length}</sup></button></div>

    {workspace === "events" ? <section className="event-manager" aria-label="Event management">
      <div className="workspace-heading"><div><p className="eyebrow">EVENTS / PUBLISHING</p><h2>Event schedule</h2></div><button className="button" type="button" onClick={() => { setEventMessage(""); setEventDraft(newEventDraft()); }}><Icon name="calendar" /><span>New event</span></button></div>
      {eventDraft ? <EventEditor draft={eventDraft} setDraft={setEventDraft} onSave={saveEvent} onCancel={() => setEventDraft(null)} pending={eventPending} /> : null}
      {eventMessage ? <p className={`workspace-message ${eventMessage.includes("Could not") || eventMessage.includes("valid") || eventMessage.includes("must") || eventMessage.includes("Only") ? "error" : ""}`} role="status">{eventMessage}</p> : null}
      <div className="managed-event-list">
        {orderedEvents.length === 0 ? <div className="empty-state"><strong>No events published.</strong><span>Create the first workshop or club session.</span></div> : null}
        {orderedEvents.map((event) => {
          const eventAttendees = attendees.filter((attendee) => attendee.eventId === event.id);
          const competitionInterests = interests.filter((interest) => interest.eventId === event.id);
          const participationCount = event.eventType === "competition" ? competitionInterests.length : event.attendeeCount;
          const isExpanded = expandedEvent === event.id;
          return <article className={`managed-event ${event.status === "cancelled" ? "is-cancelled" : ""}`} key={event.id}>
            <div className="managed-event-date"><span>{formatDate(event.date, "month")}</span><strong>{formatDate(event.date, "day")}</strong></div>
            <div className="managed-event-copy"><div><span className={`event-status status-${event.status}`}>{event.status}</span><small>{event.eventType === "competition" ? "Competition" : event.category}</small></div><h3>{event.title}</h3><p>{event.location} · {event.startTime}—{event.endTime}</p>{event.eventType === "competition" && event.externalUrl ? <a href={event.externalUrl} target="_blank" rel="noreferrer">Open competition link</a> : null}</div>
            <button className="attendance-toggle" type="button" onClick={() => setExpandedEvent(isExpanded ? null : event.id)} aria-expanded={isExpanded}><strong>{participationCount}</strong><span>{event.eventType === "competition" ? "interested" : "attending"}</span></button>
            <div className="managed-event-actions"><button type="button" onClick={() => editEvent(event)}>Edit</button><button type="button" disabled={eventPending} onClick={() => changeEventStatus(event, event.status === "cancelled" ? "upcoming" : "cancelled")}>{event.status === "cancelled" ? "Publish" : "Cancel"}</button></div>
            {isExpanded ? <div className="attendee-list">{event.eventType === "competition" ? competitionInterests.length ? competitionInterests.map((interest) => <div key={interest.userId}><strong>{interest.name}</strong><span>{interest.ascId} · Grade {interest.grade}</span><span>{interest.direction}</span></div>) : <p>No one has marked interest yet.</p> : eventAttendees.length ? eventAttendees.map((attendee) => <div key={attendee.userId}><strong>{attendee.name}</strong><span>{attendee.ascId}</span><a href={`mailto:${attendee.email}`}>{attendee.email}</a></div>) : <p>No one has joined this meeting yet.</p>}</div> : null}
          </article>;
        })}
      </div>
    </section> : <section aria-label="Member management">
      <div className="admin-stats"><div><strong>{members.filter(m => m.status === "active").length}</strong><span>Active members</span></div><div><strong>{members.filter(m => m.status === "pending").length}</strong><span>Pending approval</span></div><div><strong>{members.filter(m => m.competitionInterest).length}</strong><span>Competition interest</span></div></div>
      <div className="filter-bar admin-filters"><label className="search-field"><Icon name="search" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search members…" /></label><label><span>Grade</span><select value={grade} onChange={e => setGrade(e.target.value)}><option>All</option>{[7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label><label><span>Direction</span><select value={direction} onChange={e => setDirection(e.target.value as Direction | "All")}><option>All</option><option>Machine Learning</option><option>Arduino</option><option>Programming</option><option>Both</option><option>Not sure</option></select></label><label><span>Level</span><select value={level} onChange={e => setLevel(e.target.value as Level | "All")}><option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label className="competition-filter"><input type="checkbox" checked={competitionOnly} onChange={e => setCompetitionOnly(e.target.checked)} /> Competition interest</label></div>
      <div className="admin-result"><strong>{filtered.length}</strong> matching members {pending ? "· SAVING" : ""}{message ? <span role="status"> · {message}</span> : null}</div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Grade</th><th>Direction</th><th>Meeting days</th><th>Role</th><th>Status</th><th>Private contact</th></tr></thead><tbody>{filtered.map(member => <tr key={member.id}><td><strong>{member.profileComplete ? `${member.firstName} ${member.lastName}` : "Profile incomplete"}</strong><small>{member.ascId}</small></td><td>{member.profileComplete ? member.grade : "—"}</td><td>{member.profileComplete ? member.direction : "—"}</td><td><span className="availability-cell">{member.availabilityDays.length ? member.availabilityDays.map((day) => day.slice(0, 3)).join(" · ") : "Not selected"}</span></td><td>{viewer.role === "admin" ? <select aria-label={`Role for ${member.firstName || member.email}`} value={member.role} disabled={pending} onChange={(event) => updateAccess(member, event.target.value as Role, member.status)}><option value="member">Member</option><option value="organizer">Organizer</option><option value="admin">Admin</option></select> : member.role}</td><td>{viewer.role === "admin" ? <select aria-label={`Status for ${member.firstName || member.email}`} value={member.status} disabled={pending} onChange={(event) => updateAccess(member, member.role, event.target.value as ProfileStatus)}><option value="pending">Pending</option><option value="active">Active</option><option value="suspended">Suspended</option></select> : member.status}</td><td><a href={`mailto:${member.email}`}>{member.email}</a><small>{member.whatsapp || "No WhatsApp"}</small></td></tr>)}</tbody></table></div>
    </section>}
  </div>;
}

function EventEditor({ draft, setDraft, onSave, onCancel, pending }: { draft: EventInput; setDraft: (draft: EventInput) => void; onSave: (draft: EventInput) => void; onCancel: () => void; pending: boolean }) {
  const update = <Key extends keyof EventInput>(key: Key, value: EventInput[Key]) => setDraft({ ...draft, [key]: value });
  return <form className="event-editor" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
    <div className="event-editor-title"><div><p className="eyebrow">{draft.id ? "EDIT EVENT" : "NEW EVENT"}</p><h3>{draft.id ? "Update the announcement" : "Publish to the club"}</h3></div><button type="button" onClick={onCancel} aria-label="Close event editor"><Icon name="close" /></button></div>
    <div className="form-grid event-form-grid">
      <label className="wide">Title<input required maxLength={100} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder={draft.eventType === "competition" ? "National robotics challenge" : "Arduino prototyping meeting"} /></label>
      <label>Type<select value={draft.eventType} onChange={(event) => update("eventType", event.target.value as EventType)}><option value="meeting">Meeting</option><option value="competition">Competition</option></select></label>
      <label>Category<input required maxLength={50} value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="Workshop" /></label>
      <label>Location<input required maxLength={120} value={draft.location} onChange={(event) => update("location", event.target.value)} placeholder="Engineering Block, Lab 2" /></label>
      <label>Date<input required type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} /></label>
      <label>Starts<input required type="time" value={draft.startTime} onChange={(event) => update("startTime", event.target.value)} /></label>
      <label>Ends<input required type="time" value={draft.endTime} onChange={(event) => update("endTime", event.target.value)} /></label>
      <label>Status<select value={draft.status} onChange={(event) => update("status", event.target.value as EventStatus)}><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="cancelled">Cancelled</option></select></label>
      {draft.eventType === "competition" ? <label className="wide">Competition link<input required type="url" maxLength={500} value={draft.externalUrl} onChange={(event) => update("externalUrl", event.target.value)} placeholder="https://competition.example/apply" /></label> : null}
      <label className="wide">Description<textarea required maxLength={1000} rows={4} value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder="What members will learn, build or prepare." /></label>
    </div>
    <div className="event-editor-actions"><button className="button" type="submit" disabled={pending}><span>{pending ? "Publishing…" : draft.id ? "Save event" : "Publish event"}</span><Icon name="arrow" /></button><button className="text-link" type="button" onClick={onCancel}>Discard</button></div>
  </form>;
}
