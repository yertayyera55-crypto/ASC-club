# ASC Club Portal

Private responsive portal for **ASC — Automated Systems Club**.

The interface follows an editorial, engineering-led visual system: off-white paper surfaces, black technical plates, sparse orange registration marks, strict typography, and original ink-style illustrations. All navigation, lists, filters, profiles, event rows, and controls are real responsive interface elements.

## Included

- Home with the next event, announcements, club count, and quick navigation
- Google sign-in with administrator approval for new members
- Upcoming/past event views with database-backed RSVP state
- Searchable member directory with grade, direction, and level filters
- Public member profile drawer with role-aware contact visibility
- Editable personal profile
- Organizer member database with private contacts and competition filters
- Admin controls for approval, suspension, and Member/Organizer/Admin roles
- Responsive desktop and mobile navigation

## Run locally

1. Copy `.env.example` to `.env.local` and add the Supabase values.
2. Run:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

Production verification:

```bash
npm run lint
npm run build
python3 ~/.codex/skills/webapp-testing/scripts/with_server.py \
  --server "npm run dev" --port 3000 -- python3 tests/ui_check.py
```

The first administrator is assigned by the database trigger to `yertay.yera55@gmail.com`. Every other Google account starts in `pending` status and sees only its own application until an administrator approves it.

## Architecture

- `app/` — Next.js App Router entry, OAuth callback, and authenticated Server Actions
- `components/` — portal UI and code-native icon set
- `data/` — shared domain types (no member records)
- `lib/supabase/` — browser, server, admin, and session-refresh clients
- `lib/portal-data.ts` — server-only portal data loader
- `supabase/migrations/` — versioned database schema, grants, and RLS policies
- `tests/` — desktop/mobile interaction smoke test

## Privacy boundary

Authorization is enforced in PostgreSQL RLS and repeated inside privileged Server Actions:

- members may read public profile fields and edit only their own profile;
- organizers/admins may read private contacts;
- role changes, account deactivation, and administrative writes require admin authorization;
- signed-out visitors cannot read any club table;
- the Supabase service-role key is server-only and never exposed to the browser.

Before sharing the production link with students, complete [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md).

## Artwork

The two technical illustration assets were generated specifically for this prototype from a style brief. They are independent visual assets; the UI itself is implemented in HTML/CSS/React.
