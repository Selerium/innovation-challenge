// Demo-mode API router. Serves static data from data.ts (mirroring the exact
// response bodies of apps/server/src/routes/*) when NEXT_PUBLIC_DEMO_MODE=true.
// GET requests return real demo data; all mutations are disabled.

import {
  ALERTS,
  CLASSES,
  PROFILES,
  SESSIONS,
  TRANSACTIONS,
  aiHistoryForSubject,
  allAssignments,
  assignmentById,
  assignmentsForProfile,
  classById,
  classesForProfile,
  conversationById,
  conversationsForProfile,
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  leaderboardFor,
  profileById,
  subjectById,
  subjectsByProfile,
  tutoringForProfile,
} from "./data";
import type { DemoAssignment, DemoClass, DemoConversation, DemoProfile, DemoTutoring } from "./data";
import { getDemoRole, DEMO_DISABLED_MESSAGE } from "./role";

export { DEMO_DISABLED_MESSAGE };

export type DemoBody = {
  success: boolean;
  data?: unknown;
  error?: string;
};

function ok(payload: unknown): DemoBody {
  return { success: true, data: { success: true, data: payload } };
}

function fail(message: string): DemoBody {
  return { success: false, error: message };
}

function currentProfile(): DemoProfile {
  const role = getDemoRole();
  return (role === "TEACHER" ? profileById(DEMO_TEACHER_ID) : profileById(DEMO_STUDENT_ID)) as DemoProfile;
}

// ------------------------------------------------------------------- shapes

function sessionPayload(p: DemoProfile) {
  return {
    user: { id: p.id, email: p.email, name: p.name, role: p.role },
    profile: {
      id: p.id,
      displayName: p.displayName,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      xp: p.xp,
      level: p.level,
      onboardingDone: p.onboardingDone,
      createdAt: p.createdAt,
    },
  };
}

function classListItem(c: DemoClass, p: DemoProfile) {
  return {
    id: c.id,
    name: c.name,
    teacherName: c.teacherName,
    userRole: c.teacherId === p.id ? "TEACHER" : "STUDENT",
    memberCount: c.members.length,
    inviteCode: c.inviteCode,
  };
}

function classDetail(c: DemoClass, p: DemoProfile) {
  const assignments = c.assignmentIds
    .map((id) => assignmentById(id))
    .filter((a): a is DemoAssignment => a != null);
  return {
    id: c.id,
    name: c.name,
    teacherName: c.teacherName,
    inviteCode: c.inviteCode,
    isTeacher: c.teacherId === p.id,
    members: c.members.map((m) => ({
      id: m,
      displayName: PROFILES[m]?.displayName ?? "Unknown",
      role: PROFILES[m]?.role ?? "STUDENT",
    })),
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      questionCount: a.questions.length,
      maxScore: a.questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0),
      submissionCount: a.submissions.length,
      gradedCount: a.submissions.filter((s) => s.status === "GRADED").length,
    })),
  };
}

function assignmentListItem(a: DemoAssignment, profileId: string) {
  const submission = a.submissions.find((s) => s.profileId === profileId) ?? null;
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    createdAt: a.createdAt,
    subject: { name: a.subjectName, grade: a.subjectGrade },
    submission: submission ? { status: submission.status } : null,
  };
}

function assignmentDetail(a: DemoAssignment, profileId: string) {
  const submission = a.submissions.find((s) => s.profileId === profileId) ?? null;
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    createdAt: a.createdAt,
    dueDate: a.dueDate,
    subject: { name: a.subjectName, grade: a.subjectGrade },
    content: { questions: a.questions },
    submission: submission ? { content: submission.content, status: submission.status } : null,
  };
}

function conversationItem(c: DemoConversation, profileId: string) {
  const peerId = c.profileIds.find((id) => id !== profileId);
  const peer = peerId ? PROFILES[peerId] : null;
  const last = c.messages[c.messages.length - 1] ?? null;
  return {
    conversationId: c.id,
    status: c.status,
    source: c.source,
    peer: peer ? { id: peer.id, displayName: peer.displayName, avatarUrl: peer.avatarUrl } : null,
    lastMessage: last ? last.content : null,
    lastMessageAt: c.updatedAt,
    unreadCount: c.messages.filter((m) => m.senderId !== profileId && !m.read).length,
  };
}

function peersFor(profileId: string, query: string) {
  const sharedClasses = classesForProfile(profileId);
  const classNamesFor = (pid: string) =>
    sharedClasses.filter((c) => c.members.includes(pid)).map((c) => c.name);
  const ids = new Set<string>();
  for (const c of sharedClasses) {
    for (const m of c.members) ids.add(m);
    if (c.teacherId) ids.add(c.teacherId);
  }
  ids.delete(profileId);
  const q = query.trim().toLowerCase();
  return [...ids]
    .map((id) => PROFILES[id])
    .filter((p): p is DemoProfile => p != null)
    .filter((p) => !q || p.displayName.toLowerCase().includes(q))
    .map((p) => ({
      id: p.id,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      role: p.role,
      classes: classNamesFor(p.id),
    }));
}

function tutoringItem(t: DemoTutoring) {
  const requester = PROFILES[t.requesterId];
  const tutor = t.tutorId ? PROFILES[t.tutorId] : null;
  const toRef = (p: DemoProfile | undefined, fallbackId: string) =>
    p ? { id: p.id, displayName: p.displayName, avatarUrl: p.avatarUrl } : { id: fallbackId, displayName: "Unknown", avatarUrl: null };
  return {
    id: t.id,
    type: t.type,
    topic: t.topic,
    grade: t.grade,
    status: t.status,
    createdAt: t.createdAt,
    pairedId: t.pairedId,
    tutorId: t.tutorId,
    requester: toRef(requester, t.requesterId),
    tutor: tutor ? { id: tutor.id, displayName: tutor.displayName, avatarUrl: tutor.avatarUrl } : null,
  };
}

function teacherAnalytics(p: DemoProfile) {
  return CLASSES.filter((c) => c.teacherId === p.id).map((c) => {
    const assigns = c.assignmentIds
      .map((id) => assignmentById(id))
      .filter((a): a is DemoAssignment => a != null);
    const subs = assigns.flatMap((a) => a.submissions);
    const ai = subs.map((s) => s.aiScore).filter((x): x is number => x != null);
    const ts = subs.map((s) => s.teacherScore).filter((x): x is number => x != null);
    const atRiskCount = c.members.filter((m) => {
      const alert = ALERTS[m]?.find((a) => !a.resolved);
      return alert != null && alert.score >= 50;
    }).length;
    return {
      class: { id: c.id, name: c.name, memberCount: c.members.length },
      submissions: subs.length,
      avgAiScore: ai.length ? Math.round(ai.reduce((a, b) => a + b, 0) / ai.length) : null,
      avgTeacherScore: ts.length ? Math.round(ts.reduce((a, b) => a + b, 0) / ts.length) : null,
      atRiskCount,
    };
  });
}

function teacherSubmissions(profileId: string) {
  const out: unknown[] = [];
  for (const a of allAssignments()) {
    if (a.classId == null) continue;
    const c = classById(a.classId);
    if (!c || c.teacherId !== profileId) continue;
    const maxScore = a.questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    for (const s of a.submissions) {
      out.push({
        id: `${a.id}:${s.profileId}`,
        assignmentId: a.id,
        assignmentTitle: a.title,
        subjectName: a.subjectName,
        classId: a.classId,
        className: c.name,
        studentName: PROFILES[s.profileId]?.displayName ?? "Unknown",
        content: s.content,
        questions: a.questions,
        maxScore,
        aiScore: s.aiScore,
        aiFeedback: s.aiFeedback,
        teacherScore: s.teacherScore,
        teacherComment: s.teacherComment,
        status: s.status,
        submittedAt: s.submittedAt,
      });
    }
  }
  return out;
}

function teacherStudents(c: DemoClass) {
  return c.members
    .map((m) => {
      const p = PROFILES[m];
      if (!p) return null;
      const subjects = subjectsByProfile(m);
      const topicsMastered = subjects
        .flatMap((s) => s.topic)
        .filter((t) => t.status === "MASTERED").length;
      const classAssigns = c.assignmentIds
        .map((id) => assignmentById(id))
        .filter((a): a is DemoAssignment => a != null);
      const scores = classAssigns
        .flatMap((a) => a.submissions)
        .filter((s) => s.profileId === m && s.teacherScore != null)
        .map((s) => s.teacherScore as number);
      const alert = ALERTS[m]?.find((a) => !a.resolved) ?? ALERTS[m]?.[0] ?? null;
      return {
        profileId: m,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        level: p.level,
        xp: p.xp,
        subjects: subjects.length,
        topicsMastered,
        avgAssignmentScore: scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
        burnoutScore: alert ? alert.score : null,
        atRisk: alert != null && alert.score >= 50,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s != null);
}

function studentDetail(profileId: string) {
  const p = PROFILES[profileId];
  if (!p) return null;
  const subjects = subjectsByProfile(profileId).map((s) => {
    const topics = s.topic;
    return {
      id: s.id,
      name: s.name,
      grade: s.grade,
      topicsTotal: topics.length,
      topicsMastered: topics.filter((t) => t.status === "MASTERED").length,
      averageProgress: topics.length
        ? Math.round(topics.reduce((sum, t) => sum + t.progress, 0) / topics.length)
        : 0,
    };
  });
  const assignments = allAssignments().flatMap((a) =>
    a.submissions
      .filter((s) => s.profileId === profileId)
      .map((s) => ({
        id: a.id,
        title: a.title,
        subjectName: a.subjectName,
        aiScore: s.aiScore,
        teacherScore: s.teacherScore,
        status: s.status,
        submittedAt: s.submittedAt,
      }))
  );
  return {
    profile: { displayName: p.displayName, avatarUrl: p.avatarUrl, level: p.level, xp: p.xp, bio: p.bio },
    subjects,
    assignments,
    burnoutAlerts: ALERTS[profileId] ?? [],
  };
}

// ------------------------------------------------------------------- routes

type RouteCtx = { params: URLSearchParams; body: unknown };
type GetRoute = { pattern: RegExp; run: (match: RegExpMatchArray, ctx: RouteCtx) => unknown };

const GET_ROUTES: GetRoute[] = [
  { pattern: /^\/api\/health$/, run: () => ({ status: "ok" }) },
  { pattern: /^\/api\/session$/, run: () => sessionPayload(currentProfile()) },
  { pattern: /^\/api\/profile$/, run: () => sessionPayload(currentProfile()) },
  { pattern: /^\/api\/subjects$/, run: () => subjectsByProfile(currentProfile().id) },
  {
    pattern: /^\/api\/subjects\/([^/]+)\/topics$/,
    run: (m) => subjectById(m[1])?.topic ?? [],
  },
  { pattern: /^\/api\/subjects\/([^/]+)$/, run: (m) => subjectById(m[1]) },
  {
    pattern: /^\/api\/assignments$/,
    run: () =>
      assignmentsForProfile(currentProfile().id)
        .map((a) => assignmentListItem(a, currentProfile().id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },
  {
    pattern: /^\/api\/assignments\/([^/]+)$/,
    run: (m) => {
      const a = assignmentById(m[1]);
      return a ? assignmentDetail(a, currentProfile().id) : null;
    },
  },
  { pattern: /^\/api\/classes$/, run: () => classesForProfile(currentProfile().id).map((c) => classListItem(c, currentProfile())) },
  {
    pattern: /^\/api\/classes\/([^/]+)$/,
    run: (m) => {
      const c = classById(m[1]);
      return c ? classDetail(c, currentProfile()) : null;
    },
  },
  { pattern: /^\/api\/burnout\/alerts$/, run: () => ALERTS[currentProfile().id] ?? [] },
  { pattern: /^\/api\/gamification\/leaderboard$/, run: () => leaderboardFor(currentProfile().id) },
  { pattern: /^\/api\/gamification\/transactions$/, run: () => TRANSACTIONS[currentProfile().id] ?? [] },
  { pattern: /^\/api\/study-sessions$/, run: () => SESSIONS[currentProfile().id] ?? [] },
  {
    pattern: /^\/api\/chat\/conversations$/,
    run: () => conversationsForProfile(currentProfile().id).map((c) => conversationItem(c, currentProfile().id)),
  },
  { pattern: /^\/api\/chat\/peers$/, run: (_m, ctx) => peersFor(currentProfile().id, ctx.params.get("q") ?? "") },
  {
    pattern: /^\/api\/chat\/([^/]+)\/messages$/,
    run: (m) => conversationById(m[1])?.messages ?? [],
  },
  { pattern: /^\/api\/tutoring\/my$/, run: () => tutoringForProfile(currentProfile().id).map(tutoringItem) },
  { pattern: /^\/api\/teacher\/submissions$/, run: () => teacherSubmissions(currentProfile().id) },
  { pattern: /^\/api\/teacher\/analytics$/, run: () => teacherAnalytics(currentProfile()) },
  {
    pattern: /^\/api\/teacher\/classes\/([^/]+)\/submissions$/,
    run: (m, ctx) => {
      const c = classById(m[1]);
      if (!c) return [];
      let subs = teacherSubmissions(currentProfile().id).filter((s) => (s as { classId: string }).classId === c.id);
      const aid = ctx.params.get("assignmentId");
      if (aid) subs = subs.filter((s) => (s as { assignmentId: string }).assignmentId === aid);
      return subs;
    },
  },
  {
    pattern: /^\/api\/teacher\/classes\/([^/]+)\/students$/,
    run: (m) => {
      const c = classById(m[1]);
      return c ? teacherStudents(c) : [];
    },
  },
  {
    pattern: /^\/api\/teacher\/students\/([^/]+)$/,
    run: (m) => studentDetail(m[1]),
  },
  {
    pattern: /^\/api\/ai\/history\/([^/]+)$/,
    run: (m, ctx) => {
      const topicId = ctx.params.get("topicId");
      const msgs = aiHistoryForSubject(m[1]);
      return { messages: topicId ? msgs.filter((x) => x.topicId === topicId) : msgs };
    },
  },
];

// ------------------------------------------------------------------- entry

export async function demoApi(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<DemoBody> {
  const method = (options.method || "GET").toUpperCase();
  const [pathname, queryString] = path.split("?");
  const ctx: RouteCtx = { params: new URLSearchParams(queryString ?? ""), body: options.body };

  if (method === "GET") {
    for (const route of GET_ROUTES) {
      const match = pathname.match(route.pattern);
      if (match) {
        const payload = route.run(match, ctx);
        if (payload === undefined || payload === null) {
          return fail("The requested resource could not be found.");
        }
        return ok(payload);
      }
    }
    return ok({});
  }

  // Keep the study-session hook functional (heartbeat / end), disable everything else.
  const heartbeat = pathname.match(/^\/api\/study-sessions\/heartbeat$/);
  if (heartbeat) {
    const topicId = (options.body as { topicId?: string } | undefined)?.topicId ?? null;
    const now = new Date().toISOString();
    return ok({ id: "demo-session", topicId, startedAt: now, lastActiveAt: now, endedAt: null, previousXp: null });
  }

  const endSession = pathname.match(/^\/api\/study-sessions\/([^/]+)\/end$/);
  if (endSession) {
    const p = currentProfile();
    return ok({ id: endSession[1], xpAwarded: 0, level: p.level, leveledUp: false, durationMinutes: 0 });
  }

  return fail(DEMO_DISABLED_MESSAGE);
}
