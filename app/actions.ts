"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Direction, Level, ProfileInput, ProfileStatus, Role } from "@/data/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; message: string };

const directions: Direction[] = ["Machine Learning", "Arduino", "Both", "Not sure"];
const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];
const roles: Role[] = ["member", "organizer", "admin"];
const statuses: ProfileStatus[] = ["pending", "active", "suspended"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function authenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return null;
  return { supabase, userId };
}

function validateProfile(input: ProfileInput): string | null {
  if (input.firstName.trim().length < 2 || input.lastName.trim().length < 2) return "Enter your first and last name.";
  if (!Number.isInteger(input.grade) || input.grade < 7 || input.grade > 12) return "Choose a grade from 7 to 12.";
  if (!directions.includes(input.direction)) return "Choose a valid direction.";
  if (!levels.includes(input.level)) return "Choose a valid experience level.";
  if (input.bio.length > 500) return "Bio must be 500 characters or fewer.";
  if (input.skills.length > 12 || input.skills.some((skill) => skill.length > 40)) return "Use up to 12 short skill labels.";
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

  const [profileResult, contactResult] = await Promise.all([
    auth.supabase.from("profiles").update(profileUpdate).eq("id", auth.userId),
    auth.supabase.from("member_contacts").update({
      email: input.email.trim().toLowerCase(),
      whatsapp: input.whatsapp.trim(),
    }).eq("user_id", auth.userId),
  ]);

  if (profileResult.error || contactResult.error) {
    return { ok: false, message: "Could not save your profile. Please try again." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function setRsvpAction(eventId: string, attending: boolean): Promise<ActionResult> {
  const auth = await authenticatedUserId();
  if (!auth) return { ok: false, message: "Your session expired. Sign in again." };
  if (!uuidPattern.test(eventId)) return { ok: false, message: "Invalid event." };

  const result = attending
    ? await auth.supabase.from("event_rsvps").insert({ event_id: eventId, user_id: auth.userId })
    : await auth.supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", auth.userId);

  if (result.error && result.error.code !== "23505") {
    return { ok: false, message: "Could not update your RSVP." };
  }

  revalidatePath("/");
  return { ok: true };
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
