# ASC Portal — Pre-launch checklist

Do not distribute the portal to students until every unchecked item below is complete.

## Remove prototype-only behavior

- [x] Remove all mock student, event, announcement, email, and WhatsApp records.
- [x] Replace localStorage and mock services with Supabase data access.
- [x] Remove the development role preview.
- [x] Verify an empty production database before first login.

## Authentication and authorization

- [x] Finish Google OAuth provider setup in Google Cloud and Supabase.
- [x] Require administrator approval for every new account except the initial admin.
- [x] Enforce roles with PostgreSQL grants, RLS, and authenticated Server Actions.
- [x] Keep private contacts in a separate restricted table.
- [x] Allow members to update only their own profile columns.
- [x] Restrict role and account-status changes to active admins.

## Student data and operations

- [ ] Get school approval for the fields being collected and their retention period.
- [x] Start with an empty database; add only real users through registration.
- [x] Add a privacy notice and a process for profile correction/deletion.
- [ ] Test Member, Organizer, and Admin accounts separately.
- [x] Run `npm run lint`, `npm run build`, `npm audit`, and the signed-out Playwright smoke test.
- [ ] Review the production URL on mobile before sharing it with the club.
