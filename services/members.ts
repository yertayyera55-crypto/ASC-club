import { members as seedMembers } from "@/data/mock";
import type { Direction, Level, Member } from "@/data/types";

export interface MemberFilters {
  query?: string;
  grade?: string;
  direction?: Direction | "All";
  level?: Level | "All";
  competitionOnly?: boolean;
}

export async function listMembers(filters: MemberFilters = {}): Promise<Member[]> {
  const query = filters.query?.trim().toLowerCase();
  return seedMembers.filter((member) => {
    const haystack = `${member.firstName} ${member.lastName} ${member.skills.join(" ")}`.toLowerCase();
    return (!query || haystack.includes(query))
      && (!filters.grade || filters.grade === "All" || member.grade === Number(filters.grade))
      && (!filters.direction || filters.direction === "All" || member.direction === filters.direction)
      && (!filters.level || filters.level === "All" || member.level === filters.level)
      && (!filters.competitionOnly || member.competitionInterest);
  });
}

export async function updateMemberProfile(id: string, values: Partial<Member>): Promise<Member> {
  const member = seedMembers.find((item) => item.id === id);
  if (!member) throw new Error("Member not found");
  return { ...member, ...values, id: member.id, role: member.role };
}

export function canViewPrivateContacts(viewer: Member): boolean {
  return viewer.role === "organizer" || viewer.role === "admin";
}
