# ASC Club Portal

Private responsive portal prototype for **ASC — Automated Systems Club**.

The interface follows an editorial, engineering-led visual system: off-white paper surfaces, black technical plates, sparse orange registration marks, strict typography, and original ink-style illustrations. All navigation, lists, filters, profiles, event rows, and controls are real responsive interface elements.

## Included

- Home with the next event, announcements, club count, and quick navigation
- Upcoming/past event views with persistent local RSVP state
- Searchable member directory with grade, direction, and level filters
- Public member profile drawer with role-aware contact visibility
- Editable personal profile
- Organizer member database with private contacts and competition filters
- Responsive desktop and mobile navigation

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production verification:

```bash
npm run lint
npm run build
python3 tests/ui_check.py
```

The Playwright check expects the development server to be running on port `3000`.

## Architecture

- `app/` — Next.js App Router entry and global visual system
- `components/` — portal UI and code-native icon set
- `data/` — typed mock records
- `services/` — repository-style data access for members, events, announcements, and session
- `tests/` — desktop/mobile interaction smoke test

The UI calls the service layer rather than accessing mock records directly. A future Firebase implementation can replace these services while keeping the component API stable.

## Privacy boundary

The current project is a frontend prototype. UI role checks demonstrate intended behavior but are **not a security boundary**. Before using real student data, enforce authorization in Firebase Security Rules or trusted backend code:

- members may read public profile fields and edit only their own profile;
- organizers/admins may read private contacts;
- role changes, account deactivation, and administrative writes require admin authorization;
- invite codes must be validated and expire server-side.

## Artwork

The two technical illustration assets were generated specifically for this prototype from a style brief. They are independent visual assets; the UI itself is implemented in HTML/CSS/React.
