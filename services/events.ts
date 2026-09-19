import { events } from "@/data/mock";
import type { ClubEvent } from "@/data/types";

const RSVP_KEY = "asc-event-rsvps";

export async function listEvents(status?: ClubEvent["status"]): Promise<ClubEvent[]> {
  return status ? events.filter((event) => event.status === status) : events;
}

export function getRsvps(): string[] {
  if (typeof window === "undefined") return ["ev-arduino"];
  const stored = window.localStorage.getItem(RSVP_KEY);
  if (!stored) return ["ev-arduino"];
  const parsed: unknown = JSON.parse(stored);
  if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  if (parsed && typeof parsed === "object" && "version" in parsed && "eventIds" in parsed) {
    const value = parsed as { version: number; eventIds: unknown };
    if (value.version === 1 && Array.isArray(value.eventIds)) return value.eventIds.filter((item): item is string => typeof item === "string");
  }
  return ["ev-arduino"];
}

export async function setRsvp(eventId: string, attending: boolean): Promise<string[]> {
  const current = getRsvps();
  const next = attending
    ? Array.from(new Set([...current, eventId]))
    : current.filter((id) => id !== eventId);
  window.localStorage.setItem(RSVP_KEY, JSON.stringify({ version: 1, eventIds: next }));
  return next;
}
