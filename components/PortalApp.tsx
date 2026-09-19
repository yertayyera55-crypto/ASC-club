"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Announcement, ClubEvent, Direction, Level, Member, Role } from "@/data/types";
import { listAnnouncements } from "@/services/announcements";
import { getRsvps, listEvents, setRsvp } from "@/services/events";
import { canViewPrivateContacts, listMembers, updateMemberProfile } from "@/services/members";
import { getCurrentUser } from "@/services/session";
import { Icon } from "./Icons";

type Page = "home" | "events" | "members" | "profile" | "admin";

const nav: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "members", label: "Members", icon: "users" },
  { id: "profile", label: "Profile", icon: "user" },
  { id: "admin", label: "Admin", icon: "admin" },
];

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

export function PortalApp() {
  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<Member | null>(null);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [rsvps, setRsvps] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([getCurrentUser(), listEvents(), listMembers(), listAnnouncements()]).then(([me, eventData, memberData, announcementData]) => {
      setUser(me);
      setEvents(eventData);
      setMembers(memberData);
      setAnnouncements(announcementData);
      setRsvps(getRsvps());
    });
  }, []);

  const navigate = (next: Page) => {
    setPage(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleRsvp = async (eventId: string) => {
    setRsvps(await setRsvp(eventId, !rsvps.includes(eventId)));
  };

  if (!user) return <div className="loading"><span className="orange-dot" /> Loading ASC portal</div>;

  const visibleNav = nav.filter((item) => item.id !== "admin" || user.role !== "member");

  return (
    <div className="app-shell">
      {process.env.NODE_ENV === "development" ? <DemoRoleSwitcher role={user.role} onChange={(role) => {
        setUser((current) => current ? { ...current, role } : current);
        if (role === "member" && page === "admin") setPage("home");
      }} /> : null}
      <Header page={page} items={visibleNav} onNavigate={navigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main key={page} className="page-enter">
        {page === "home" && <HomePage user={user} events={events} announcements={announcements} rsvps={rsvps} onRsvp={toggleRsvp} onNavigate={navigate} />}
        {page === "events" && <EventsPage events={events} rsvps={rsvps} onRsvp={toggleRsvp} />}
        {page === "members" && <MembersPage viewer={user} />}
        {page === "profile" && <ProfilePage user={user} onSave={setUser} />}
        {page === "admin" && <AdminPage members={members} />}
      </main>
      <MobileNav page={page} items={visibleNav} onNavigate={navigate} />
      <footer className="site-footer">
        <div><strong>ASC</strong> <span>Automated Systems Club</span></div>
        <p>Students today. A brighter tomorrow.</p>
      </footer>
    </div>
  );
}

function DemoRoleSwitcher({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  const roles: Role[] = ["member", "organizer", "admin"];
  return (
    <div className="demo-toolbar" role="region" aria-label="Development role preview">
      <div className="demo-toolbar-inner">
        <span><i /> DEV PREVIEW</span>
        <p>View portal as</p>
        <div className="role-switch" role="group" aria-label="Preview role">
          {roles.map((item) => <button key={item} className={role === item ? "active" : ""} onClick={() => onChange(item)}>{item}</button>)}
        </div>
        <small>MOCK DATA · REMOVE BEFORE LAUNCH</small>
      </div>
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

function HomePage({ user, events, announcements, rsvps, onRsvp, onNavigate }: { user: Member; events: ClubEvent[]; announcements: Announcement[]; rsvps: string[]; onRsvp: (id: string) => void; onNavigate: (page: Page) => void }) {
  const nextEvent = events.find((event) => event.status === "upcoming");
  if (!nextEvent) return null;
  const attending = rsvps.includes(nextEvent.id);

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

      <section className="feature-event">
        <div className="event-copy">
          <p className="eyebrow light">NEXT EVENT</p>
          <h2>{nextEvent.title}</h2>
          <div className="event-meta"><span><Icon name="calendar" />{formatDate(nextEvent.date)}</span><span><Icon name="clock" />{nextEvent.startTime} — {nextEvent.endTime}</span><span><Icon name="pin" />{nextEvent.location}</span></div>
          <p>{nextEvent.description}</p>
          <div className="event-actions"><ActionButton active={attending} onClick={() => onRsvp(nextEvent.id)}>{attending ? "I’m attending" : "Join event"}</ActionButton><span>{nextEvent.attendeeCount + (attending ? 1 : 0)} members going</span></div>
        </div>
        <div className="event-art" onContextMenu={(event) => event.preventDefault()}><Image src="/assets/asc-rover.png" alt="Ink-style autonomous rover" fill loading="eager" draggable={false} sizes="(max-width: 800px) 100vw, 45vw" /></div>
        <div className="margin-note">SMALL<br />COMPONENTS<br />BIG<br />POSSIBILITIES</div>
      </section>

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
          {announcements.map((item) => <article key={item.id} className="announcement-row"><span className="orange-dot" /><div><h3>{item.title}</h3><p>{item.body}</p></div><time>{formatDate(item.createdAt)}</time></article>)}
        </div>
        <div className="club-note">
          <p className="eyebrow">THE CLUB, RIGHT NOW</p>
          <strong>90</strong>
          <span>members learning,<br />testing and building together.</span>
          <div className="rule-art"><i /><i /><i /><i /></div>
        </div>
      </section>
    </div>
  );
}

function EventsPage({ events, rsvps, onRsvp }: { events: ClubEvent[]; rsvps: string[]; onRsvp: (id: string) => void }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const visible = events.filter((event) => event.status === tab);
  return (
    <div className="content-page">
      <header className="page-header"><div><p className="eyebrow">PROGRAM / 2026</p><h1>Events</h1></div><p>Workshops, talks and focused build sessions. Join what moves your work forward.</p></header>
      <div className="tab-bar"><button className={tab === "upcoming" ? "active" : ""} onClick={() => setTab("upcoming")}>Upcoming <sup>{events.filter(e => e.status === "upcoming").length}</sup></button><button className={tab === "past" ? "active" : ""} onClick={() => setTab("past")}>Past <sup>{events.filter(e => e.status === "past").length}</sup></button></div>
      <div className="event-list">
        {visible.map((event, index) => {
          const attending = rsvps.includes(event.id);
          return <article className="event-row" key={event.id} style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}>
            <div className="event-date"><span>{formatDate(event.date, "month")}</span><strong>{formatDate(event.date, "day")}</strong></div>
            <div className="event-info"><p className="event-category">{event.category}</p><h2>{event.title}</h2><p>{event.description}</p></div>
            <div className="event-details"><span><Icon name="clock" />{event.startTime} — {event.endTime}</span><span><Icon name="pin" />{event.location}</span><small>{event.attendeeCount + (attending ? 1 : 0)} attending</small></div>
            {tab === "upcoming" ? <ActionButton active={attending} onClick={() => onRsvp(event.id)}>{attending ? "Going" : "Join"}</ActionButton> : <span className="past-label">COMPLETED</span>}
          </article>;
        })}
      </div>
    </div>
  );
}

function MembersPage({ viewer }: { viewer: Member }) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("All");
  const [direction, setDirection] = useState<Direction | "All">("All");
  const [level, setLevel] = useState<Level | "All">("All");
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => { listMembers({ query, grade, direction, level }).then(setMembers); }, [query, grade, direction, level]);

  return (
    <div className="content-page members-page">
      <header className="page-header"><div><p className="eyebrow">CLUB DIRECTORY</p><h1>Members</h1></div><p>A community of builders, thinkers and doers. Find someone who knows the thing you want to learn.</p></header>
      <div className="filter-bar">
        <label className="search-field"><Icon name="search" /><input aria-label="Search members" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or skill…" /></label>
        <label><span>Grade</span><select value={grade} onChange={(e) => setGrade(e.target.value)}><option>All</option>{[7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label>
        <label><span>Direction</span><select value={direction} onChange={(e) => setDirection(e.target.value as Direction | "All")}><option>All</option><option>Machine Learning</option><option>Arduino</option><option>Both</option><option>Not sure</option></select></label>
        <label><span>Level</span><select value={level} onChange={(e) => setLevel(e.target.value as Level | "All")}><option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
      </div>
      <div className="results-line"><span>{members.length} MEMBERS FOUND</span><i /></div>
      <div className="member-list">
        {members.map((member, index) => <button className="member-row" key={member.id} onClick={() => setSelected(member)} style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}><Initials member={member} /><div className="member-name"><strong>{member.firstName} {member.lastName}</strong><span>{member.ascId}</span></div><span className="member-grade">Grade {member.grade}</span><span className="member-direction">{member.direction}</span><span className="member-level">{member.level}</span><div className="member-skills">{member.skills.slice(0, 2).map(skill => <i key={skill}>{skill}</i>)}</div><Icon name="arrow" /></button>)}
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

  const save = async () => {
    const updated = await updateMemberProfile(user.id, draft);
    onSave(updated); setDraft(updated); setEditing(false); setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return <div className="content-page profile-page">
    <header className="profile-hero"><div className="profile-number">{user.ascId.split("-")[1]}</div><div className="profile-main"><p className="eyebrow">YOUR CLUB PROFILE · {user.ascId}</p><h1>{draft.firstName}<br />{draft.lastName}</h1><p>{draft.bio}</p></div><Initials member={draft} large /><button className="button profile-edit" onClick={() => setEditing(!editing)}><Icon name={editing ? "close" : "edit"}/><span>{editing ? "Cancel" : "Edit profile"}</span></button></header>
    {saved && <div className="saved-toast"><Icon name="check" /> Profile updated</div>}
    {editing ? <ProfileForm draft={draft} setDraft={setDraft} onSave={save} /> : <div className="profile-layout"><dl className="profile-details"><div><dt>Grade</dt><dd>{draft.grade}</dd></div><div><dt>Direction</dt><dd>{draft.direction}</dd></div><div><dt>Experience</dt><dd>{draft.level}</dd></div><div><dt>Competition interest</dt><dd>{draft.competitionInterest ? "Yes — contact me" : "Not right now"}</dd></div></dl><div className="profile-side"><div className="skills-block"><p className="eyebrow">SKILLS / INTERESTS</p><div>{draft.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div><div className="profile-contact"><p className="eyebrow">PRIVATE CONTACT</p><p>{draft.email}<br />{draft.whatsapp}</p><small>Only organizers and admins can see this information.</small></div></div></div>}
    <div className="profile-quote"><span>“</span><p>Build small.<br />Test honestly.<br />Share what works.</p></div>
  </div>;
}

function ProfileForm({ draft, setDraft, onSave }: { draft: Member; setDraft: (member: Member) => void; onSave: () => void }) {
  const update = (key: keyof Member, value: Member[keyof Member]) => setDraft({ ...draft, [key]: value });
  return <form className="profile-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}><div className="form-grid"><label>First name<input value={draft.firstName} onChange={e => update("firstName", e.target.value)} /></label><label>Last name<input value={draft.lastName} onChange={e => update("lastName", e.target.value)} /></label><label>Grade<select value={draft.grade} onChange={e => update("grade", Number(e.target.value))}>{[7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label><label>Direction<select value={draft.direction} onChange={e => update("direction", e.target.value as Direction)}><option>Machine Learning</option><option>Arduino</option><option>Both</option><option>Not sure</option></select></label><label>Experience<select value={draft.level} onChange={e => update("level", e.target.value as Level)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label className="checkbox-label"><input type="checkbox" checked={draft.competitionInterest} onChange={e => update("competitionInterest", e.target.checked)} /> Interested in competitions</label><label className="wide">Short bio<textarea value={draft.bio} onChange={e => update("bio", e.target.value)} rows={3} /></label><label className="wide">Skills <small>Separate with commas</small><input value={draft.skills.join(", ")} onChange={e => update("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} /></label><label>Email<input type="email" value={draft.email} onChange={e => update("email", e.target.value)} /></label><label>WhatsApp<input value={draft.whatsapp} onChange={e => update("whatsapp", e.target.value)} /></label></div><button className="button form-save" type="submit"><span>Save changes</span><Icon name="arrow" /></button></form>;
}

function AdminPage({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("All");
  const [direction, setDirection] = useState<Direction | "All">("All");
  const [level, setLevel] = useState<Level | "All">("All");
  const [competitionOnly, setCompetitionOnly] = useState(false);
  const filtered = useMemo(() => members.filter(member => `${member.firstName} ${member.lastName}`.toLowerCase().includes(query.toLowerCase()) && (grade === "All" || member.grade === Number(grade)) && (direction === "All" || member.direction === direction) && (level === "All" || member.level === level) && (!competitionOnly || member.competitionInterest)), [members, query, grade, direction, level, competitionOnly]);
  return <div className="content-page admin-page"><header className="page-header"><div><p className="eyebrow">ORGANIZER WORKSPACE</p><h1>Member database</h1></div><p>Filter the club by grade, direction and experience. Private contacts stay restricted to this workspace.</p></header><div className="admin-stats"><div><strong>90</strong><span>Total members</span></div><div><strong>{members.filter(m => m.competitionInterest).length}</strong><span>Competition ready*</span></div><div><strong>{members.filter(m => m.direction === "Arduino" || m.direction === "Both").length}</strong><span>Arduino sample*</span></div><small>* Counts reflect mock records in this prototype.</small></div><div className="filter-bar admin-filters"><label className="search-field"><Icon name="search" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search members…" /></label><label><span>Grade</span><select value={grade} onChange={e => setGrade(e.target.value)}><option>All</option>{[7,8,9,10,11,12].map(n => <option key={n}>{n}</option>)}</select></label><label><span>Direction</span><select value={direction} onChange={e => setDirection(e.target.value as Direction | "All")}><option>All</option><option>Machine Learning</option><option>Arduino</option><option>Both</option><option>Not sure</option></select></label><label><span>Level</span><select value={level} onChange={e => setLevel(e.target.value as Level | "All")}><option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label className="competition-filter"><input type="checkbox" checked={competitionOnly} onChange={e => setCompetitionOnly(e.target.checked)} /> Competition interest</label></div><div className="admin-result"><strong>{filtered.length}</strong> matching members</div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Grade</th><th>Direction</th><th>Level</th><th>Competition</th><th>Private contact</th></tr></thead><tbody>{filtered.map(member => <tr key={member.id}><td><strong>{member.firstName} {member.lastName}</strong><small>{member.ascId}</small></td><td>{member.grade}</td><td>{member.direction}</td><td>{member.level}</td><td>{member.competitionInterest ? "Yes" : "—"}</td><td><a href={`mailto:${member.email}`}>{member.email}</a><small>{member.whatsapp}</small></td></tr>)}</tbody></table></div></div>;
}
