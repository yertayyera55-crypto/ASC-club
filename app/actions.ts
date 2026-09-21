"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClubEvent, Direction, EventInput, EventStatus, EventType, Level, ProfileInput, ProfileStatus, Role, Weekday } from "@/data/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; message: string };
type EventActionResult = { ok: true; event: ClubEvent } | { ok: false; message: string };

const directions: Direction[] = ["Machine Learning", "Arduino", "Programming", "Both", "Not sure"];
const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];
const weekdays: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const roles: Role[] = ["member", "organizer", "admin"];
const statuses: ProfileStatus[] = ["pending", "active", "suspended"];
const eventStatuses: EventStatus[] = ["upcoming", "past", "cancelled"];
const eventTypes: EventType[] = ["meeting", "competition"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function authenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return null;
  return { supabase, userId };
}

async function activeStaffContext() {
  const auth = await authenticatedUserId();
  if (!auth) return null;
  const { data: viewer } = await auth.supabase
    .from("profiles")
    .select("role,status")
    .eq("id", auth.userId)
    .single();
  if (viewer?.status !== "active" || !["organizer", "admin"].includes(viewer.role)) return null;
  return auth;
}

function validateEvent(input: EventInput): string | null {
  if (input.id && !uuidPattern.test(input.id)) return "Invalid event.";
  if (input.title.trim().length < 3 || input.title.trim().length > 100) return "Use an event title from 3 to 100 characters.";
  if (input.category.trim().length < 2 || input.category.trim().length > 50) return "Use a short event category.";
  if (input.location.trim().length < 2 || input.location.trim().length > 120) return "Enter a valid event location.";
  if (input.description.trim().length < 10 || input.description.trim().length > 1000) return "Use a description from 10 to 1000 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) return "Choose a valid date and time.";
  if (!eventStatuses.includes(input.status)) return "Choose a valid event status.";
  if (!eventTypes.includes(input.eventType)) return "Choose a valid event type.";
  if (input.eventType === "competition") {
    try {
      const url = new URL(input.externalUrl);
      if (!["http:", "https:"].includes(url.protocol)) return "Enter a valid competition link.";
    } catch {
      return "Enter a valid competition link.";
    }
  }
  const startsAt = new Date(`${input.date}T${input.startTime}:00+05:00`);
  const endsAt = new Date(`${input.date}T${input.endTime}:00+05:00`);
  if (Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf()) || endsAt <= startsAt) return "The end time must be later than the start time.";
  return null;
}

function eventFromRow(row: { id: string; title: string; starts_at: string; ends_at: string; location: string; description: string; attendee_count: number; status: EventStatus; category: string; event_type: EventType; external_url: string | null }): ClubEvent {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit" });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = dateFormatter.formatToParts(new Date(row.starts_at));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    id: row.id,
    title: row.title,
    date: `${part("year")}-${part("month")}-${part("day")}`,
    startTime: timeFormatter.format(new Date(row.starts_at)),
    endTime: timeFormatter.format(new Date(row.ends_at)),
    location: row.location,
    description: row.description,
    attendeeCount: row.attendee_count,
    status: row.status,
    category: row.category,
    eventType: row.event_type,
    externalUrl: row.external_url ?? "",
  };
}

function validateProfile(input: ProfileInput): string | null {
  if (input.firstName.trim().length < 2 || input.lastName.trim().length < 2) return "Enter your first and last name.";
  if (!Number.isInteger(input.grade) || input.grade < 7 || input.grade > 12) return "Choose a grade from 7 to 12.";
  if (!directions.includes(input.direction)) return "Choose a valid direction.";
  if (!levels.includes(input.level)) return "Choose a valid experience level.";
  if (input.bio.length > 500) return "Bio must be 500 characters or fewer.";
  if (input.skills.length > 12 || input.skills.some((skill) => skill.length > 40)) return "Use up to 12 short skill labels.";
  if (input.availabilityDays.length > 7 || input.availabilityDays.some((day) => !weekdays.includes(day))) return "Choose valid meeting days.";
  if (!/^\S+@\S+\.\S+$/.test(input.email)) return "Enter a valid email address.";
  if (input.whatsapp.length > 40) return "WhatsApp number is too long.";
  return null;
}

export async function saveProfileAction(input: ProfileInput): Promise<ActionResult> {
  const auth = await authenticatedUserId();
  if (!auth) return { ok: false, message: "Your session expired. Sign in again." };
  const validationError = validateProfile(input);
  if (validationError) return { ok: false, message: validationError };

  const profileUpdate = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    grade: input.grade,
    direction: input.direction,
    level: input.level,
    skills: input.skills.map((skill) => skill.trim()).filter(Boolean),
    competition_interest: input.competitionInterest,
    bio: input.bio.trim(),
  };

  const [profileResult, contactResult, preferenceResult] = await Promise.all([
    auth.supabase.from("profiles").update(profileUpdate).eq("id", auth.userId),
    auth.supabase.from("member_contacts").update({
      email: input.email.trim().toLowerCase(),
      whatsapp: input.whatsapp.trim(),
    }).eq("user_id", auth.userId),
    auth.supabase.from("member_preferences").upsert({
      user_id: auth.userId,
      availability_days: [...new Set(input.availabilityDays)],
    }, { onConflict: "user_id" }),
  ]);

  if (profileResult.error || contactResult.error || preferenceResult.error) {
    return { ok: false, message: "Could not save your profile. Please try again." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function setEventInterestAction(eventId: string, interested: boolean): Promise<ActionResult> {
  const auth = await authenticatedUserId();
  if (!auth) return { ok: false, message: "Your session expired. Sign in again." };
  if (!uuidPattern.test(eventId)) return { ok: false, message: "Invalid competition." };

  const { data: event } = await auth.supabase
    .from("events")
    .select("event_type,status")
    .eq("id", eventId)
    .single();
  if (!event || event.event_type !== "competition" || event.status !== "upcoming") {
    return { ok: false, message: "This competition is not accepting interest." };
  }

  const result = interested
    ? await auth.supabase.from("event_interests").insert({ event_id: eventId, user_id: auth.userId })
    : await auth.supabase.from("event_interests").delete().eq("event_id", eventId).eq("user_id", auth.userId);
  if (result.error && result.error.code !== "23505") {
    return { ok: false, message: "Could not update your competition interest." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function setRsvpAction(eventId: string, attending: boolean): Promise<ActionResult> {
  const auth = await authenticatedUserId();
  if (!auth) return { ok: false, message: "Your session expired. Sign in again." };
  if (!uuidPattern.test(eventId)) return { ok: false, message: "Invalid event." };

  const { data: event } = await auth.supabase
    .from("events")
    .select("event_type,status")
    .eq("id", eventId)
    .single();
  if (!event || event.event_type !== "meeting" || (attending && event.status !== "upcoming")) {
    return { ok: false, message: "This meeting is not accepting RSVPs." };
  }

  const result = attending
    ? await auth.supabase.from("event_rsvps").insert({ event_id: eventId, user_id: auth.userId })
    : await auth.supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", auth.userId);

  if (result.error && result.error.code !== "23505") {
    return { ok: false, message: "Could not update your RSVP." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function saveEventAction(input: EventInput): Promise<EventActionResult> {
  const auth = await activeStaffContext();
  if (!auth) return { ok: false, message: "Only active organizers and administrators can manage events." };
  const validationError = validateEvent(input);
  if (validationError) return { ok: false, message: validationError };

  const payload = {
    title: input.title.trim(),
    starts_at: new Date(`${input.date}T${input.startTime}:00+05:00`).toISOString(),
    ends_at: new Date(`${input.date}T${input.endTime}:00+05:00`).toISOString(),
    location: input.location.trim(),
    description: input.description.trim(),
    status: input.status,
    category: input.category.trim(),
    event_type: input.eventType,
    external_url: input.eventType === "competition" ? input.externalUrl.trim() : null,
  };

  const query = input.id
    ? auth.supabase.from("events").update(payload).eq("id", input.id)
    : auth.supabase.from("events").insert({ ...payload, created_by: auth.userId });
  const { data, error } = await query.select("id,title,starts_at,ends_at,location,description,attendee_count,status,category,event_type,external_url").single();
  if (error || !data) return { ok: false, message: "Could not save the event. Please try again." };

  revalidatePath("/");
  return { ok: true, event: eventFromRow(data) };
}

export async function updateMemberAccessAction(memberId: string, role: Role, status: ProfileStatus): Promise<ActionResult> {
  const auth = await authenticatedUserId();
  if (!auth) return { ok: false, message: "Your session expired. Sign in again." };
  if (!uuidPattern.test(memberId) || !roles.includes(role) || !statuses.includes(status)) {
    return { ok: false, message: "Invalid member access change." };
  }

  const { data: viewer } = await auth.supabase
    .from("profiles")
    .select("role,status")
    .eq("id", auth.userId)
    .single();

  if (viewer?.role !== "admin" || viewer.status !== "active") {
    return { ok: false, message: "Only an active administrator can change access." };
  }
  if (memberId === auth.userId && (role !== "admin" || status !== "active")) {
    return { ok: false, message: "You cannot remove your own administrator access." };
  }

  const admin = createAdminClient();
  if (status === "active") {
    const { data: target } = await admin.from("profiles").select("first_name,last_name,grade,direction,level").eq("id", memberId).single();
    if (!target?.first_name?.trim() || !target.last_name?.trim() || !target.grade || !target.direction || !target.level) {
      return { ok: false, message: "This member must complete their profile before approval." };
    }
  }
  const { error } = await admin.from("profiles").update({ role, status }).eq("id", memberId);
  if (error) return { ok: false, message: "Could not update this member." };

  revalidatePath("/");
  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
