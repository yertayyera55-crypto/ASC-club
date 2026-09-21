import "server-only";
import type { Announcement, ClubEvent, Direction, EventAttendee, EventInterest, EventType, Level, Member, ProfileStatus, Role, Weekday } from "@/data/types";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  member_number: number;
  first_name: string;
  last_name: string;
  grade: number | null;
  direction: Direction | null;
  level: Level | null;
  skills: string[];
  competition_interest: boolean;
  role: Role;
  status: ProfileStatus;
  bio: string;
};

type ContactRow = { user_id: string; email: string; whatsapp: string };
type PreferenceRow = { user_id: string; availability_days: Weekday[] };
type InterestRow = { event_id: string; user_id: string };

export type AccountProfile = ProfileRow & { email: string; whatsapp: string; availability_days: Weekday[] };

export type PortalState = {
  user: Member;
  events: ClubEvent[];
  members: Member[];
  adminMembers: Member[];
  announcements: Announcement[];
  rsvps: string[];
  eventAttendees: EventAttendee[];
  interestEventIds: string[];
  eventInterests: EventInterest[];
};

export function isProfileComplete(profile: AccountProfile) {
  return Boolean(profile.first_name.trim() && profile.last_name.trim() && profile.grade && profile.direction && profile.level);
}

function asDateParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function asTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function toMember(profile: ProfileRow, contact?: ContactRow, availabilityDays: Weekday[] = []): Member {
  return {
    id: profile.id,
    ascId: `ASC-${profile.member_number}`,
    firstName: profile.first_name,
    lastName: profile.last_name,
    grade: profile.grade ?? 7,
    direction: profile.direction ?? "Not sure",
    level: profile.level ?? "Beginner",
    skills: profile.skills ?? [],
    competitionInterest: profile.competition_interest,
    availabilityDays,
    role: profile.role,
    status: profile.status,
    email: contact?.email ?? "",
    whatsapp: contact?.whatsapp ?? "",
    bio: profile.bio,
    profileComplete: Boolean(profile.first_name.trim() && profile.last_name.trim() && profile.grade && profile.direction && profile.level),
  };
}

export async function loadAccount() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (typeof userId !== "string") return { supabase, account: null };

  const [{ data: profile }, { data: contact }, { data: preferences }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("member_contacts").select("user_id,email,whatsapp").eq("user_id", userId).single(),
    supabase.from("member_preferences").select("user_id,availability_days").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !contact) return { supabase, account: null };
  return { supabase, account: { ...(profile as ProfileRow), ...(contact as ContactRow), availability_days: (preferences?.availability_days ?? []) as Weekday[] } as AccountProfile };
}

export async function loadPortalState(account: AccountProfile): Promise<PortalState> {
  const supabase = await createClient();
  const isStaff = account.role === "admin" || account.role === "organizer";
  const profileQuery = isStaff
    ? supabase.from("profiles").select("*").order("member_number")
    : supabase.from("profiles").select("*").eq("status", "active").order("member_number");
  const rsvpQuery = isStaff
    ? supabase.from("event_rsvps").select("event_id,user_id")
    : supabase.from("event_rsvps").select("event_id,user_id").eq("user_id", account.id);
  const preferenceQuery = isStaff
    ? supabase.from("member_preferences").select("user_id,availability_days")
    : supabase.from("member_preferences").select("user_id,availability_days").eq("user_id", account.id);

  const [profilesResult, contactsResult, preferencesResult, eventsResult, announcementsResult, rsvpsResult, interestsResult] = await Promise.all([
    profileQuery,
    supabase.from("member_contacts").select("user_id,email,whatsapp"),
    preferenceQuery,
    supabase.from("events").select("*").order("starts_at"),
    supabase.from("announcements").select("*").order("published_at", { ascending: false }),
    rsvpQuery,
    supabase.from("event_interests").select("event_id,user_id"),
  ]);

  const failed = [profilesResult, contactsResult, preferencesResult, eventsResult, announcementsResult, rsvpsResult, interestsResult].find((result) => result.error);
  if (failed?.error) throw new Error("Could not load the ASC portal.");

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const contacts = (contactsResult.data ?? []) as ContactRow[];
  const preferences = (preferencesResult.data ?? []) as PreferenceRow[];
  const contactByUser = new Map(contacts.map((contact) => [contact.user_id, contact]));
  const preferenceByUser = new Map(preferences.map((preference) => [preference.user_id, preference.availability_days]));
  const allMembers = profiles.map((profile) => toMember(profile, contactByUser.get(profile.id), preferenceByUser.get(profile.id)));
  const memberById = new Map(allMembers.map((member) => [member.id, member]));

  const events: ClubEvent[] = (eventsResult.data ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    date: asDateParts(event.starts_at),
    startTime: asTime(event.starts_at),
    endTime: asTime(event.ends_at),
    location: event.location,
    description: event.description,
    attendeeCount: event.attendee_count,
    status: event.status,
    category: event.category,
    eventType: event.event_type as EventType,
    externalUrl: event.external_url ?? "",
  }));

  const announcements: Announcement[] = (announcementsResult.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    createdAt: asDateParts(item.published_at),
  }));

  const eventInterests: EventInterest[] = ((interestsResult.data ?? []) as InterestRow[]).flatMap((interest) => {
    const member = memberById.get(interest.user_id);
    return member ? [{
      eventId: interest.event_id,
      userId: interest.user_id,
      name: `${member.firstName} ${member.lastName}`,
      ascId: member.ascId,
      grade: member.grade,
      direction: member.direction,
      skills: member.skills,
    }] : [];
  });

  return {
    user: toMember(account, { user_id: account.id, email: account.email, whatsapp: account.whatsapp }, account.availability_days),
    events,
    members: allMembers.filter((member) => member.status === "active"),
    adminMembers: allMembers,
    announcements,
    rsvps: (rsvpsResult.data ?? []).filter((item) => item.user_id === account.id).map((item) => item.event_id),
    eventAttendees: isStaff ? (rsvpsResult.data ?? []).flatMap((item) => {
      const member = memberById.get(item.user_id);
      return member ? [{ eventId: item.event_id, userId: item.user_id, name: `${member.firstName} ${member.lastName}`, email: member.email, ascId: member.ascId }] : [];
    }) : [],
    interestEventIds: eventInterests.filter((interest) => interest.userId === account.id).map((interest) => interest.eventId),
    eventInterests,
  };
}
