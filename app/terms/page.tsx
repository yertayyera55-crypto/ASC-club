import type { Metadata } from "next";
import { PublicDocument } from "@/components/PublicDocument";

export const metadata: Metadata = {
  title: "Terms — ASC Club Portal",
  description: "Rules for using the ASC Club Portal.",
};

const sections = [
  {
    title: "Purpose and eligibility",
    paragraphs: [
      "ASC Club Portal is a private collaboration space for Automated Systems Club members and organizers. Signing in does not automatically grant membership; new accounts remain pending until an administrator approves them.",
      "Use the portal only with your own Google account and provide accurate information in your application and profile.",
    ],
  },
  {
    title: "Respectful use",
    paragraphs: [
      "Use member information only for legitimate club activities. Do not harass members, copy private contact details for unrelated purposes, impersonate another person, attempt to bypass access controls, or disrupt the portal.",
      "Club projects and events must follow applicable school rules, safety requirements, and organizer instructions.",
    ],
  },
  {
    title: "Accounts and moderation",
    paragraphs: [
      "Administrators may approve, suspend, change the role of, or remove an account when needed to protect members, enforce these terms, or follow school requirements.",
      "If you believe an account decision was made in error, contact an ASC administrator at yertay.yera55@gmail.com.",
    ],
  },
  {
    title: "Projects and content",
    paragraphs: [
      "Only upload or submit content you are allowed to share. You remain responsible for your own project materials. The club may display submitted content inside the portal to support collaboration and showcase club work.",
    ],
  },
  {
    title: "Changes and availability",
    paragraphs: [
      "The portal may change as the club develops. Features can be added, limited, or removed, and temporary interruptions may occur. Material updates to these terms will be reflected on this page.",
      "By continuing to use the portal, you agree to the current terms and the Privacy Notice.",
    ],
  },
];

export default function TermsPage() {
  return <PublicDocument eyebrow="PORTAL USE" title="Terms of use." updated="September 20, 2026" sections={sections} />;
}
