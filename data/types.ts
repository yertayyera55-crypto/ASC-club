export type Role = "member" | "organizer" | "admin";
export type ProfileStatus = "pending" | "active" | "suspended";
export type Direction = "Machine Learning" | "Arduino" | "Programming" | "Both" | "Not sure";
export type Level = "Beginner" | "Intermediate" | "Advanced";
export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export type EventType = "meeting" | "competition";

export interface Member {
  id: string;
  ascId: string;
  firstName: string;
  lastName: string;
  grade: number;
  direction: Direction;
  level: Level;
  skills: string[];
  competitionInterest: boolean;
  availabilityDays: Weekday[];
  role: Role;
  email: string;
  whatsapp: string;
  bio: string;
  status: ProfileStatus;
  profileComplete: boolean;
}

export interface ProfileInput {
  firstName: string;
  lastName: string;
  grade: number;
  direction: Direction;
  level: Level;
  skills: string[];
  competitionInterest: boolean;
  availabilityDays: Weekday[];
  bio: string;
  email: string;
  whatsapp: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  attendeeCount: number;
  status: "upcoming" | "past" | "cancelled";
  category: string;
  eventType: EventType;
  externalUrl: string;
}

export type EventStatus = ClubEvent["status"];

export interface EventInput {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  status: EventStatus;
  category: string;
  eventType: EventType;
  externalUrl: string;
}

export interface EventAttendee {
  eventId: string;
  userId: string;
  name: string;
  email: string;
  ascId: string;
}

export interface EventInterest {
  eventId: string;
  userId: string;
  name: string;
  ascId: string;
  grade: number;
  direction: Direction;
  skills: string[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}
