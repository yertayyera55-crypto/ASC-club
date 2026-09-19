# ASC Portal — Pre-launch checklist

This prototype is **not ready for distribution to students until every item below is complete**.

## Remove prototype-only behavior

- [ ] Remove the mock records from `data/mock.ts` and verify they are absent from the client bundle.
- [ ] Replace `services/session.ts`, `services/members.ts`, `services/events.ts`, and `services/announcements.ts` with production data adapters.
- [ ] Confirm that the development role preview is absent from the deployed build.
- [ ] Remove any temporary sample announcements, events, emails, and WhatsApp numbers.

## Authentication and authorization

- [ ] Implement invitation-only account creation and email verification.
- [ ] Enforce roles in trusted backend code or Firebase Security Rules—not only in React.
- [ ] Verify that a member cannot request another member’s email or WhatsApp number directly.
- [ ] Verify that members can update only their own profile.
- [ ] Restrict role changes, deactivation, and administrative writes to admins.
- [ ] Add expiration and single-use rules for invitation codes.

## Student data and operations

- [ ] Get school approval for the fields being collected and their retention period.
- [ ] Import only approved member data.
- [ ] Add a privacy notice and a process for profile correction/deletion.
- [ ] Test Member, Organizer, and Admin accounts separately.
- [ ] Run `npm run lint`, `npm run build`, `npm audit`, and the Playwright smoke test.
- [ ] Review the production URL on mobile before sharing it with the club.
