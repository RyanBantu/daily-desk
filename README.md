# Westbrook School Portal (demo)

A frontend-only demo of a school management portal for sales demos, with Admin, Teacher, Student and Parent views. It is a Next.js port of [`reference/portal.html`](reference/portal.html).

> **This is a demo.** There is no backend, no database and no real login. All data lives in your browser's `localStorage`, so changes you make during a demo survive page reloads but are only visible on that browser. Use **Reset demo data** (sidebar footer, or Admin › School settings) to restore the sample school.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You land on `/login`. Pick a role (and a teacher, student or parent) and click **Log in**. No password is needed.

Other scripts:

```bash
npm run build   # production build (must pass with no type errors)
npm run start   # serve the production build
npm run lint
```

## Deploy to Vercel

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel, choose **Add New › Project** and import the repository.
3. Keep every default setting (framework preset Next.js, no environment variables) and click **Deploy**.

Or from the command line: `npx vercel` and accept the defaults.

## How the demo works

- **Login**: `/login` saves `{ role, userId }` to a `demo_session` cookie and the app store. `proxy.ts` (Next.js 16's name for middleware) sends visitors without a session to `/login`, and sends anyone on the wrong portal to their own role's home.
- **Switching roles**: the segmented switch in the header jumps between portals; the dropdowns next to it change which teacher, student or parent you are. **Log out** returns to `/login`.
- **Data**: seeded from `lib/seed.ts` on first visit, with dates generated relative to today so the demo always looks current. Stored with Zustand `persist` under the `westbrook.portal.v2` key.
- **Teacher → parent flow**: anything a teacher sends "to parents" (exam scores, homework feedback, remarks) appears immediately in that child's Parent › Messages.

## Project layout

| Path | What it holds |
| --- | --- |
| `app/login` | Demo login page |
| `app/(portal)/{admin,teacher,student,parent}` | One route per sidebar item; shared header and sidebar in `app/(portal)/layout.tsx` |
| `components/` | Header, Sidebar, RoleSwitch, PageHead, Panel, StatRow, Pill, TimetableGrid, CourseTimeline, ResultsTable, AttendanceSummary, and other shared pieces |
| `lib/types.ts` | Data model |
| `lib/seed.ts` | Sample school |
| `lib/store.ts` | Zustand store with `localStorage` persistence |
| `lib/selectors.ts` | Attendance %, averages, CBSE grade, teacher class·subject contexts, due state |
| `app/globals.css` | Theme colours, school palettes and component styles |
