"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClubEvent, Direction, EventStatus, EventType, Level, ProfileInput, ProfileStatus, Role, Weekday } from "@/data/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; message: string };
type EventActionResult = { ok: true; event: ClubEvent } | { ok: false; message: string };

const directions: Direction[] = ["Machine Learning", "Arduino", "Programming", "Both", "Not sure"];
const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];
const weekdays: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const roles: Role[] = ["member", "organizer", "admin"];
const statuses: ProfileStatus[] = ["pending", "active", "suspended"];
const eventTypes: EventType[] = ["meeting", "competition"];
const eventImageBucket = "event-images";
const eventImageTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
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

function eventFromRow(row: { id: string; title: string; starts_at: string | null; ends_at: string | null; location: string | null; description: string; attendee_count: number; status: EventStatus; category: string; event_type: EventType; external_url: string | null; image_path: string | null; created_at: string }): ClubEvent {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit" });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = row.starts_at ? dateFormatter.formatToParts(new Date(row.starts_at)) : [];
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    id: row.id,
    title: row.title,
    date: row.starts_at ? `${part("year")}-${part("month")}-${part("day")}` : null,
    startTime: row.starts_at ? timeFormatter.format(new Date(row.starts_at)) : "",
    endTime: row.ends_at ? timeFormatter.format(new Date(row.ends_at)) : "",
    location: row.location,
    description: row.description,
    imagePath: row.image_path,
    publishedAt: row.created_at,
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

  const saveAvailability = async () => {
    const availabilityDays = [...new Set(input.availabilityDays)];
    const inserted = await auth.supabase.from("member_preferences").insert({
      user_id: auth.userId,
      availability_days: availabilityDays,
    });
    if (!inserted.error || inserted.error.code !== "23505") return inserted;

    return auth.supabase.from("member_preferences")
      .update({ availability_days: availabilityDays })
      .eq("user_id", auth.userId);
  };

  const [profileResult, contactResult, preferenceResult] = await Promise.all([
    auth.supabase.from("profiles").update(profileUpdate).eq("id", auth.userId),
    auth.supabase.from("member_contacts").update({
      email: input.email.trim().toLowerCase(),
      whatsapp: input.whatsapp.trim(),
    }).eq("user_id", auth.userId),
    saveAvailability(),
  ]);

  if (profileResult.error || contactResult.error || preferenceResult.error) {
    console.error("Profile save failed", {
      profile: profileResult.error?.code,
      contact: contactResult.error?.code,
      preferences: preferenceResult.error?.code,
    });
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

export async function saveEventAction(formData: FormData): Promise<EventActionResult> {
  const auth = await activeStaffContext();
  if (!auth) return { ok: false, message: "Only active organizers and administrators can manage events." };
  const id = formData.get("id");
  const rawText = formData.get("text");
  const eventType = formData.get("eventType");
  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "true";
  if (id !== null && (typeof id !== "string" || !uuidPattern.test(id))) return { ok: false, message: "Invalid event." };
  if (typeof rawText !== "string" || !rawText.trim() || rawText.trim().length > 5000) return { ok: false, message: "Paste a message or link (up to 5,000 characters)." };
  if (typeof eventType !== "string" || !eventTypes.includes(eventType as EventType)) return { ok: false, message: "Choose competition or meeting." };
  if (image !== null && (!(image instanceof File) || !eventImageTypes[image.type] || image.size > 5 * 1024 * 1024)) return { ok: false, message: "Use a JPG, PNG, WebP or GIF image under 5 MB." };

  const text = rawText.trim();
  const firstLine = text.split(/\r?\n/).find((line) => line.trim())?.trim() ?? text;
  const linkMatch = text.match(/https?:\/\/[^\s<>"']+/i);
  const link = linkMatch?.[0].replace(/[.,;!?)}\]]+$/, "") ?? "";
  let externalUrl: string | null = null;
  if (link) {
    try {
      const parsed = new URL(link);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid URL");
      externalUrl = parsed.toString();
    } catch {
      return { ok: false, message: "The link in your message is invalid." };
    }
  }
  const linkOnly = /^https?:\/\//i.test(firstLine) && text === firstLine;
  const title = /^https?:\/\//i.test(firstLine) ? new URL(externalUrl ?? firstLine).hostname.replace(/^www\./, "") : firstLine.slice(0, 100);
  const description = linkOnly ? "" : firstLine.length > 100 ? text.slice(100).trim() : text.slice(text.indexOf(firstLine) + firstLine.length).trim();

  let oldImagePath: string | null = null;
  if (id) {
    const { data: existing, error: existingError } = await auth.supabase.from("events").select("image_path").eq("id", id).single();
    if (existingError || !existing) return { ok: false, message: "Event not found." };
    oldImagePath = existing.image_path;
  }

  let newImagePath: string | null = null;
  if (image instanceof File && image.size > 0) {
    newImagePath = `${crypto.randomUUID()}.${eventImageTypes[image.type]}`;
    const upload = await auth.supabase.storage.from(eventImageBucket).upload(newImagePath, image, { contentType: image.type, upsert: false });
    if (upload.error) {
      console.error("Event image upload failed", upload.error.message);
      return { ok: false, message: "Could not upload the image. Please try again." };
    }
  }

  const payload = {
    title,
    description,
    event_type: eventType,
    external_url: externalUrl,
    ...(newImagePath || removeImage ? { image_path: newImagePath } : {}),
  };

  const query = id
    ? auth.supabase.from("events").update(payload).eq("id", id)
    : auth.supabase.from("events").insert({ ...payload, created_by: auth.userId });
  const { data, error } = await query.select("id,title,starts_at,ends_at,location,description,attendee_count,status,category,event_type,external_url,image_path,created_at").single();
  if (error || !data) {
    if (newImagePath) await auth.supabase.storage.from(eventImageBucket).remove([newImagePath]);
    console.error("Event save failed", error?.code);
    return { ok: false, message: "Could not save the event. Please try again." };
  }
  if (oldImagePath && (newImagePath || removeImage)) await auth.supabase.storage.from(eventImageBucket).remove([oldImagePath]);

  revalidatePath("/");
  return { ok: true, event: eventFromRow(data) };
}

export async function setEventStatusAction(eventId: string, status: EventStatus): Promise<EventActionResult> {
  const auth = await activeStaffContext();
  if (!auth) return { ok: false, message: "Only active organizers and administrators can manage events." };
  if (!uuidPattern.test(eventId) || !["upcoming", "past", "cancelled"].includes(status)) return { ok: false, message: "Invalid event status." };
  const { data, error } = await auth.supabase.from("events").update({ status }).eq("id", eventId)
    .select("id,title,starts_at,ends_at,location,description,attendee_count,status,category,event_type,external_url,image_path,created_at").single();
  if (error || !data) return { ok: false, message: "Could not update the event." };
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
