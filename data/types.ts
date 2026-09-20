export type Role = "member" | "organizer" | "admin";
export type ProfileStatus = "pending" | "active" | "suspended";
export type Direction = "Machine Learning" | "Arduino" | "Both" | "Not sure";
export type Level = "Beginner" | "Intermediate" | "Advanced";

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
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}
