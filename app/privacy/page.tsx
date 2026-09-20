import type { Metadata } from "next";
import { PublicDocument } from "@/components/PublicDocument";

export const metadata: Metadata = {
  title: "Privacy Notice — ASC Club Portal",
  description: "How ASC Club Portal handles member information.",
};

const sections = [
  {
    title: "What we collect",
    paragraphs: [
      "When you sign in with Google, we receive your name, email address, profile image, and the Google account identifier needed to keep you signed in.",
      "Your member profile may include grade, direction, experience level, interests, a short biography, contact details, competition interest, event registrations, and account approval status. Please provide only information relevant to club participation.",
    ],
  },
  {
    title: "How we use it",
    paragraphs: [
      "We use this information to review membership requests, operate club events, help members collaborate, maintain the member directory, and administer the portal.",
      "We do not sell member information or use it for advertising.",
    ],
  },
  {
    title: "Who can see it",
    paragraphs: [
      "Approved members can see the public fields of other approved member profiles. Contact details are restricted to authorized organizers and administrators.",
      "The portal uses Google for sign-in, Supabase for authentication and database services, and Vercel for hosting. These providers process data only as needed to provide their services.",
    ],
  },
  {
    title: "Retention and security",
    paragraphs: [
      "Access is protected by account authentication, database row-level security, and role-based permissions. No online service can guarantee absolute security, so members should not submit sensitive information that the club does not request.",
      "Member records are kept only while needed for club operations and any school requirements. Administrators periodically review accounts and remove information that is no longer required.",
    ],
  },
  {
    title: "Your choices",
    paragraphs: [
      "You can update most profile information inside the portal. To correct or delete your account and associated data, contact an ASC administrator at yertay.yera55@gmail.com.",
      "If you do not agree with this notice, do not sign in or submit a membership application.",
    ],
  },
];

export default function PrivacyPage() {
  return <PublicDocument eyebrow="MEMBER DATA" title="Privacy notice." updated="September 20, 2026" sections={sections} />;
}
