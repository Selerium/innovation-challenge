# EduAI — Platform Summary

A personalized AI learning platform with dual roles (**Student** and **Teacher**): AI subject tutoring, gamified study tracking, peer-to-peer tutoring, realtime chat, classes with invite codes, class assignments, teacher grading, and burnout analytics. Built as a pnpm monorepo with a Next.js frontend and an Express + PostgreSQL backend.

## Architecture & Stack

```
apps/web       Next.js 15 (App Router, Tailwind v4, shadcn-style, "use client" pages)
apps/server    Express 4 + Better Auth + Prisma 6 (PostgreSQL) + ws + Gemini REST
packages/shared  Zod schemas + XP level math shared by both apps
```

- **Monorepo**: pnpm workspaces (`apps/*`, `packages/*`), `packageManager pnpm@9.15.0`.
- **Docker Compose** (root `docker compose up`):
  | Service | Port | Notes |
  |---|---|---|
  | `postgres` | 5432 | postgres:16-alpine, db/user/pass = `postgres`/`postgres`/`postgres`, db `eduai`, volume `./data` |
  | `server` | 4000 | `node --watch --experimental-strip-types src/index.ts` (no build step); on boot runs `prisma generate` + `prisma db push --skip-generate` |
  | `web` | 3000 | `next dev --turbopack`; rewrites `/api/*` → `localhost:4000` |
- **Server dev runner**: `node --watch` auto-restarts on `src/**` edits (container also watches `packages/shared`). Restart manually with `docker compose restart server|web`.
- **Env vars** (root `.env`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`, `NEXT_PUBLIC_API_URL=http://localhost:4000`, `NEXT_PUBLIC_WS_URL=ws://localhost:4000`.
- **Frontend data layer**: client-side `api(path, opts)` helper (`apps/web/src/lib/api.ts`) → `{ success, data?, error? }`, `credentials: "include"`, never throws. Auth gating is **client-side only** (no middleware): `ProfileProvider` (`lib/profile-context.tsx`) calls `GET /api/session`, redirects to `/auth/sign-in` if logged out, `/onboarding` if `!onboardingDone`. Server independently enforces `requireAuth` + `requireRole(["TEACHER"])`.
- **Auth**: Better Auth, email+password (no email verification), 7-day sessions. Signup auto-creates the profile via a DB hook. Custom `user.role` field (`STUDENT` default).
- **Real-time**: `WebSocketServer` on the same HTTP server at `/ws`, authenticated via Better Auth session. **Server-push only** events: `auth_ok`, `peer_match`, `peer_closed`, `new_message`, `conversation_closed`.

## Roles & Core Use Cases

- **Student**: create/manage subjects & topics; chat with an AI tutor per subject; get topic deep-dives and suggested next topics; generate AI assignments and submit answers; track live study sessions (heartbeat → XP); climb the leaderboard; get burnout alerts; request/offer peer tutoring and get auto-matched; chat with classmates/teachers; join classes by invite code; complete teacher-posted assignments.
- **Teacher**: build a teaching subject/topic library; plan lessons with the AI tutor; create classes with shareable invite codes; post assignments to a class (title, questions, due date); see a grading queue on the Assignments page and grade student submissions (score 0-100 + comment); monitor per-class analytics, at-risk students, and per-student drill-downs on the Teacher Dashboard.
- **Common**: realtime friends & chat (only with classmates or your teachers); classes list.

## Feature Inventory & Pages (`apps/web/src/app`)

- `/` landing · `/auth/sign-in` · `/auth/sign-up` · `/onboarding` (role picker + display name + bio).
- `(mainapp)` route group (Sidebar + ProfileProvider + WebSocketProvider):
  - `/dashboard` (**student only**) — XP/level bar, recent subjects, pending assignments, classes, unresolved burnout alert banners (dismissable).
  - `/subjects` + `/subjects/:id` — subject/topic library; topic rail; AI tutor chat panel (`POST /api/ai/chat`); quick actions "Explain" (`deep-dive`), "Suggest" (`suggest-topics`), "Assignment" (`generate`); starting a topic starts a **study session** (`use-study-session` hook, heartbeat every 60 s, 10-min idle timeout).
  - `/assignments` (**student only**, teachers are redirected to `/teacher/grade-assignments`) — students see their assignments grouped by subject; answering questions submits → 20 XP (idempotent), resubmission allowed (upserts submission).
  - `/assignments/:id` — answer questions (each question shows its marks), submit, see the correct answers once submitted.
  - `/classes` + `/classes/:id` — create class (teacher), join by invite code (student), copy invite code, member list, and (teacher) "New Assignment" modal + per-assignment "Grade" link that deep-links `/teacher/grade-assignments?assignmentId=`. Student rows link "Open" to the assignment.
  - `/teacher/grade-assignments` (**teacher only**) — grading queue across all classes (`GET /api/teacher/submissions`) with stats, "Needs grading"/"All" filter, per-question marks in `GradeSubmissionModal`, and `?classId=`/`?assignmentId=` deep-link filters (used by the class page "Grade" links).
  - `/teacher/ai-suggestions` (**teacher only**) — **frontend only**: a static preview of AI recommendations per class (at-risk students, pending grading, topic reviews). No backend — "Regenerate" just toasts "coming soon".
  - `/leaderboard` (**student only**) — top-10 by XP + your rank.
  - `/peer-learning` (**student only**) — teach/learn offers auto-matched; matched pairs get a `PEER_TUTORING` chat + link into Friends & Chat.
  - `/friends-chat` — conversation list, debounced peer search, start/close chats, live message append, `?peer=` deep-link.
  - `/profile` — avatar, level progress, XP transaction history, study history.
  - `/teacher/dashboard` (**teacher only**) — per-class cards (avg AI/teacher score, submissions, at-risk count), expandable students table + submissions table, per-student drill-down modal, and grading via the shared `GradeSubmissionModal`.
- **Sidebar** role flags (`components/layout/sidebar.tsx`): Dashboard/Leaderboard/Peer Learning and My Subjects/Assignments are `studentOnly`; Teacher Dashboard/Grade Assignments/AI Suggestions are `teacherOnly`; Classes and Friends & Chat are shared. Sign-in redirects teachers to `/teacher/dashboard`.
- **Theme** (`globals.css`): light-mode primary `#3A405A` (navy), card `#f1e3d3` (cream); dark-mode navy `#191d31` background / indigo `#4445a8` primary; attribute-based dark variant (`data-theme="dark"`), custom `lib/theme.tsx` (not next-themes). Headings tinted primary in light mode.

## Data Model (Prisma, key facts)

- `user` → `profile` (1:1, auto-created on signup) → subjects/topics, study sessions, submissions, chats, tutoring, AI conversations, burnout alerts, class memberships, XP transactions.
- `subject` (`@@unique(profileId,name,grade)`) → `topic` (status `NOT_STARTED|IN_PROGRESS|MASTERED`, progress 0-100, nullable `explanation`, `suggestions` JSON).
- `assignment` (subjectId, `creatorId`, nullable `classId` = class posting) → `assignmentSubmission` (**`@@unique(assignmentId,profileId)`**, content = JSON string of `{q1..qN: answer}`, `aiScore/aiFeedback`, `teacherScore/teacherComment`, `status`). Teacher-made assignment `content.questions[]` carry a `points` value per question (default 1 at creation, 20 in seed); `maxScore` = sum of points.
- `conversation` (`profileIds` is a **JSON array of 2 ids, no FK/no unique**; `source` `MANUAL|PEER_TUTORING`; `status` `ACTIVE|CLOSED`) → `chatMessage` (senderId FK, `read` flag).
- `tutoringRequest` (self-paired via `pairedId`; `type` `TEACH|LEARN`; `status` `OPEN|MATCHED`).
- `studySession` (startedAt/lastActiveAt/endedAt, durationMinutes, xpEarned).
- `xpTransaction` (**`@@unique(reason,refId)`** — Postgres treats NULL refId as distinct, so `addXp` also does a defensive findFirst guard).
- `eduClass` (teacherId, unique `inviteCode`) → `classMember` (`@@unique(classId,profileId)`), `assignment[]`.
- `burnoutAlert` (score 0-100, `resolved`). `aiConversation` (**`@@unique(profileId,subjectId)`**, messages JSON).
- Conversation pair uniqueness is **app-enforced only** (`findPairConversation`), not a DB constraint.

## API Surface (all routes at `/api`, JSON `{success, data?, error?}`)

**Auth** (Better Auth, auto-mounted): `/api/auth/*` (sign-up/email, sign-in/email, sign-out, session) + custom `GET /api/session` (user + profile). Also `GET /api/health`.

- `profile`: `GET /`, `PUT /` (onboarding: displayName/bio/role → sets onboardingDone), `GET /:id`.
- `ai`: `POST /chat` `{subjectId,message,topicId?}` (one conversation per subject), `POST /suggest-topics`, `POST /deep-dive`, `GET /history/:subjectId?topicId=`.
- `subjects`: `POST /` (409 on dup), `GET /`, `GET/PUT/DELETE /:id`. `topics` (mounted at `/api`): `POST /subjects/:subjectId/topics`, `GET /subjects/:subjectId/topics`, `PUT /topics/:id` (mastering awards 50 XP).
- `assignments`: `POST /generate` (AI, `{subjectId,topicId}`), `GET /` and `GET /:id` (visible if you created it OR are in the class it's posted to), `POST /:id/submit` `{answers}` → upsert submission, +20 XP.
- `tutoring`: `POST /offer`, `POST /request`, `GET /my`, `GET /available?topic=&grade=`, `POST /:id/close` (closes both sides + the PEER_TUTORING conversation).
- `chat`: `GET /peers?q=` (classmates + teachers), `POST /start` `{peerId}` (shared-class gate, reuses ACTIVE pair), `POST /:conversationId/close`, `GET /conversations`, `GET /:conversationId/messages` (marks peer msgs read), `POST /:conversationId/send` (blocked on CLOSED), `DELETE /messages/:messageId` (sender only).
- `classes`: `POST /` (teacher), `GET /`, `POST /join` `{inviteCode}`, `GET /:id` (members + assignments w/ `questionCount`/`maxScore`/submission/graded counts), `POST /:id/assignments` (teacher-owner, `{title, description?, subjectName?, topicName?, dueDate?, questions[]}` where each question has `points` — subject resolved from teacher's subjects), `POST /:id/leave`, `DELETE /:id` (teacher).
- `teacher` (**all TEACHER role**): `GET /analytics` (per-class aggregates), `GET /submissions` (grading queue across classes, class assignments only, includes per-question `questions` + `maxScore`), `GET /classes/:classId/students`, `GET /classes/:classId/submissions?assignmentId=` (also includes `questions` + `maxScore`), `GET /students/:profileId` (drill-down), `POST /classes/:classId/submissions/:submissionId/grade` `{teacherScore 0-100, teacherComment?}` → status `GRADED` (teacherScore is stored as a 0-100 percentage; per-question marks are summed client-side in `GradeSubmissionModal`).
- `burnout`: `POST /scan`, `GET /alerts`, `PATCH /alerts/:id` `{resolved}`.
- `study-sessions`: `POST /heartbeat` `{topicId}` (resumes/creates, closes stale), `POST /:id/end`, `GET /`.
- `gamification`: `GET /leaderboard` (top 10 students), `GET /transactions`.

## Gamification & Background Systems

- **XP**: 2/min studied (session finalize), +50 topic mastered, +20 assignment submitted. All idempotent via `{reason, refId}`.
- **Level curve** (`packages/shared`): `level = floor(sqrt(xp/100)) + 1`, `xpThreshold(level) = 100*level^2`, `levelProgress(xp)` used by dashboard/profile.
- **Burnout**: AI scores a user 0-100 from subjects, sessions, submissions, tutoring load; **score >= 50 = at-risk**. Manual `POST /api/burnout/scan` + a **24-hour background scan** (`jobs/daily-scan.ts`). Graceful fallback (score 0) when Gemini fails.
- **Session sweeper** (`jobs/session-sweeper.ts`): closes study sessions idle > 10 min, every 5 min.
- **Peer matching**: on offer/request, `tryMatch` pairs opposite types with same topic+grade in a transaction, creates the `PEER_TUTORING` conversation, emits `peer_match`.

## AI Integration (Gemini)

- `gemini-2.0-flash` via REST `fetch` (temperature 0.7, 2048 tokens), key `GEMINI_API_KEY`. No multi-model/provider fallback.
- Prompts in `lib/ai-prompts.ts`: study tutor persona (sees progress, flags weak topics), topic suggestions (`TOPIC:/DESCRIPTION:/CONNECTION:` parse), deep-dive, assignment generator (strict JSON; parse failure → generic fallback question), burnout analyzer.
- **Quota exhaustion (429) surfaces as 500** except burnout (fallback score 0). All features are structured so the platform still functions offline.

## Seed / Demo Data (`prisma/seed.ts`, password `demo12345`)

Wipes all tables first (tutoring → messages → conversations → classes → assignments → users cascade), then recreates:
- **1 teacher** `teacher@demo.com` (Ms. Rivera) + **8 students** (`aiden`, `zoe`, `liam`, `sofia`, `olivia`, `maya`, `noah`, `ethan` @demo.com). All `onboardingDone`, emailVerified.
- **Classes**: `Grade 7 Mathematics` (`MATH7A`: aiden, zoe, liam, sofia, olivia), `Grade 8 Science` (`SCI8B`: maya, noah, ethan), `Grade 7 Homeroom` (`HOME7C`: aiden, zoe, sofia, maya, noah).
- **Teacher subjects**: Mathematics Gr 7 (Algebra Basics MASTERED, Percentages MASTERED, Geometry Basics IN_PROGRESS) + Science Gr 8 (Photosynthesis MASTERED, Newton's Laws IN_PROGRESS, Ecosystems NOT_STARTED); teacher XP 220 → Level 2; 1 lesson-planning AI conversation.
- **Student subjects/topics** vary per student (spread of statuses/progress), with explanations and some suggestions.
- **Assignments**: 14 student-generated (8 submitted+graded w/ AI scores) + **4 teacher class assignments** (`Algebra Basics - Unit Warm-Up`, `Percentages Practice` → MATH7A; `Photosynthesis - Review Questions`, `Forces & Motion Quiz` → SCI8B, each question worth 20 marks → maxScore 100) with **10 submissions: 6 pending (needs grading) + 4 graded**.
- **Study sessions**: 19 student + 2 teacher. **AI conversations**: 15 student + 1 teacher (upserted by `profileId_subjectId`, messages embedded with topicId).
- **Chats**: 3 MANUAL pair conversations (aiden↔zoe, maya↔noah, sofia↔olivia) + 1 PEER_TUTORING (maya↔noah matched tutoring pair).
- **Tutoring**: 2 OPEN learn requests (aiden, olivia) + 1 MATCHED pair (maya teaches noah Photosynthesis).
- **Burnout alerts**: noah 76 (unresolved), ethan 61 (unresolved), liam 42 (resolved).

## Development Workflows & Gotchas

- Run: `docker compose up` (root). Re-seed: `docker compose exec -T server sh -c 'cd /app/apps/server && npx tsx prisma/seed.ts'` — **re-seeding invalidates all browser sessions**.
- **After any `schema.prisma` change**: `npx prisma db push` **and** `npx prisma generate` in the container, then `docker compose restart server` (a running process keeps the stale Prisma client — symptom: `Unknown argument` errors).
- Server typechecks are **not** gateable via `npx tsc --noEmit` (pre-existing TS5097 `.ts`-import errors + 4 pre-existing type errors in assignments/tutoring). The **web** typecheck is clean: `cd apps/web && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit`. No ESLint config is installed.
- API tests use a cookie harness: `POST /api/auth/sign-in/email` with `origin: http://localhost:3000`, read `getSetCookie()`, send `cookie` header; WS handshake uses the same cookie at `ws://localhost:4000/ws`.
- **Status-string mismatch**: web filters grading queue with `"GRADED"`, but `packages/shared` `SubmissionStatusEnum` is `["SUBMITTED","AI_GRADED","TEACHER_REVIEWED"]` — the DB/API actually use `SUBMITTED`/`GRADED`. Reconcile before adding schema validation on submission status.
- `.example.env` lists `OPENAI_API_KEY`; code uses `GEMINI_API_KEY` (real `.env` is correct).
- Auth onboarding gate in `requireAuth` is **method-permissive**: any `PUT` request bypasses the onboarding gate.
- `conversation.profileIds` JSON has no FK/uniqueness — pair uniqueness is only app-enforced (and the `PEER_TUTORING` match path doesn't dedupe on re-match).
- Server CORS allows `http://localhost:3000` and `3001`.
- Unused UI: `components/ui/button.tsx`, `components/ui/sonner.tsx`, `next-themes` dep. Cards use `bg-secondary`, not `bg-card`.
- Recent additions (uncommitted as of this summary): light theme tokens, peer chat features (`conversation.source`), teacher seed data, role-aware sidebar (My Subjects/Assignments hidden for teachers; Grade Assignments + AI Suggestions pages added), class-posted assignments with per-question marks, teacher grading queue + shared `GradeSubmissionModal` (per-question marking), AI Suggestions preview page.
