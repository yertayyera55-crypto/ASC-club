import type { Announcement, ClubEvent, Member } from "./types";

export const currentUser: Member = {
  id: "u-027",
  ascId: "ASC-027",
  firstName: "Yerassyl",
  lastName: "Yertay",
  grade: 11,
  direction: "Both",
  level: "Intermediate",
  skills: ["Python", "Machine Learning", "Arduino"],
  competitionInterest: true,
  role: "organizer",
  email: "yerassyl@school.edu",
  whatsapp: "+7 700 123 45 67",
  bio: "I build small systems that connect code, sensors and the physical world.",
};

export const members: Member[] = [
  currentUser,
  { id: "u-014", ascId: "ASC-014", firstName: "Aruzhan", lastName: "Daulet", grade: 8, direction: "Arduino", level: "Beginner", skills: ["Arduino", "Electronics", "Robotics"], competitionInterest: true, role: "member", email: "aruzhan@school.edu", whatsapp: "+7 700 222 10 14", bio: "Learning electronics by taking things apart and rebuilding them." },
  { id: "u-032", ascId: "ASC-032", firstName: "Dias", lastName: "Kim", grade: 9, direction: "Machine Learning", level: "Intermediate", skills: ["Python", "Computer Vision", "Data"], competitionInterest: true, role: "member", email: "dias@school.edu", whatsapp: "+7 700 222 10 32", bio: "Interested in models that can see and understand the world." },
  { id: "u-041", ascId: "ASC-041", firstName: "Maya", lastName: "Patel", grade: 10, direction: "Both", level: "Advanced", skills: ["CAD", "Hardware Design", "C++"], competitionInterest: true, role: "member", email: "maya@school.edu", whatsapp: "+7 700 222 10 41", bio: "From sketch to prototype — especially robots that move." },
  { id: "u-052", ascId: "ASC-052", firstName: "Ethan", lastName: "Wong", grade: 11, direction: "Machine Learning", level: "Intermediate", skills: ["Computer Vision", "Python", "OpenCV"], competitionInterest: false, role: "member", email: "ethan@school.edu", whatsapp: "+7 700 222 10 52", bio: "Exploring visual intelligence and practical ML." },
  { id: "u-063", ascId: "ASC-063", firstName: "Sofia", lastName: "Nguyen", grade: 12, direction: "Arduino", level: "Advanced", skills: ["Robotics", "Embedded", "Electronics"], competitionInterest: true, role: "organizer", email: "sofia@school.edu", whatsapp: "+7 700 222 10 63", bio: "Making hardware reliable enough to leave the workbench." },
  { id: "u-071", ascId: "ASC-071", firstName: "Liam", lastName: "Park", grade: 10, direction: "Arduino", level: "Beginner", skills: ["Electronics", "3D Printing"], competitionInterest: false, role: "member", email: "liam@school.edu", whatsapp: "+7 700 222 10 71", bio: "New to electronics and always ready to prototype." },
  { id: "u-088", ascId: "ASC-088", firstName: "Amina", lastName: "Sadyk", grade: 7, direction: "Not sure", level: "Beginner", skills: ["Scratch", "Design", "Ideas"], competitionInterest: true, role: "member", email: "amina@school.edu", whatsapp: "+7 700 222 10 88", bio: "Trying a little bit of everything before choosing a direction." },
];

export const events: ClubEvent[] = [
  { id: "ev-arduino", title: "Arduino Workshop", date: "2026-09-21", startTime: "12:00", endTime: "13:30", location: "Room 304", description: "Build a responsive light circuit and learn the signal path from sensor to output.", attendeeCount: 32, status: "upcoming", category: "Workshop" },
  { id: "ev-vision", title: "Computer Vision Lab", date: "2026-09-26", startTime: "14:00", endTime: "16:00", location: "Engineering Lab", description: "Train a compact image classifier and test it with a live camera feed.", attendeeCount: 24, status: "upcoming", category: "Lab" },
  { id: "ev-build", title: "Robotics Build Session", date: "2026-10-03", startTime: "12:30", endTime: "15:30", location: "Fab Lab", description: "Open workshop for competition teams and independent club projects.", attendeeCount: 18, status: "upcoming", category: "Build" },
  { id: "ev-talk", title: "How Machines Learn", date: "2026-09-12", startTime: "13:00", endTime: "14:00", location: "Room 210", description: "A practical introduction to datasets, models and evaluation.", attendeeCount: 41, status: "past", category: "Talk" },
  { id: "ev-kickoff", title: "ASC Season Kickoff", date: "2026-09-05", startTime: "12:00", endTime: "13:00", location: "Main Hall", description: "Meet the teams and choose what you want to build this term.", attendeeCount: 76, status: "past", category: "Club" },
];

export const announcements: Announcement[] = [
  { id: "an-1", title: "Competition teams", body: "Registration closes Friday at 18:00.", createdAt: "2026-09-19" },
  { id: "an-2", title: "New components arrived", body: "ESP32 boards and distance sensors are available in the lab.", createdAt: "2026-09-17" },
  { id: "an-3", title: "Project proposals", body: "Submit a one-page idea before the October build session.", createdAt: "2026-09-15" },
];
