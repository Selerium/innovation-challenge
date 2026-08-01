import { prisma } from "./prisma.ts";
import { addXp, XP } from "./gamification.ts";
import type { XpResult } from "./gamification.ts";

export const SILENCE_TIMEOUT_MS = 10 * 60 * 1000;

type StudySessionRecord = {
  id: string;
  profileId: string;
  topicId: string;
  startedAt: Date;
  lastActiveAt: Date | null;
  endedAt: Date | null;
};

async function getActiveSession(profileId: string) {
  return prisma.studySession.findFirst({
    where: { profileId, endedAt: null },
  });
}

async function finalizeSession(
  session: StudySessionRecord,
  endAt: Date
): Promise<{ session: any; xpResult: XpResult | null }> {
  const lastActive = session.lastActiveAt ?? session.startedAt;
  const end = endAt > lastActive ? endAt : lastActive;
  const minutes = Math.max(1, Math.round((end.getTime() - session.startedAt.getTime()) / 60000));
  const xpEarned = minutes * XP.STUDY_MINUTE;

  const updated = await prisma.studySession.update({
    where: { id: session.id },
    data: { durationMinutes: minutes, xpEarned, endedAt: end, lastActiveAt: lastActive },
  });

  let xpResult: XpResult | null = null;
  if (xpEarned > 0) {
    xpResult = await addXp(session.profileId, xpEarned, "STUDY_SESSION", session.id);
  }

  return { session: updated, xpResult };
}

// Close any sessions with no activity for longer than SILENCE_TIMEOUT_MS.
export async function closeStaleSessions(profileId?: string) {
  const stale = await prisma.studySession.findMany({
    where: {
      endedAt: null,
      lastActiveAt: { lt: new Date(Date.now() - SILENCE_TIMEOUT_MS) },
      ...(profileId ? { profileId } : {}),
    },
  });

  const closed = [];
  for (const s of stale) {
    closed.push(await finalizeSession(s, s.lastActiveAt ?? new Date()));
  }
  return closed;
}

// Record activity for a topic, creating or resuming the active session.
// Returns the active session plus any XP earned from closing a previous session.
export async function heartbeat(profileId: string, topicId: string) {
  const closed = await closeStaleSessions(profileId);
  let previousXp: XpResult | null = closed.length > 0 ? closed[0].xpResult : null;

  const topic = await prisma.topic.findFirst({
    where: { id: topicId, subject: { profileId } },
  });
  if (!topic) {
    throw new Error("Topic not found");
  }

  const active = await getActiveSession(profileId);
  if (active) {
    if (active.topicId !== topicId) {
      const { xpResult } = await finalizeSession(active, new Date());
      previousXp = xpResult ?? previousXp;
    } else {
      const session = await prisma.studySession.update({
        where: { id: active.id },
        data: { lastActiveAt: new Date() },
      });
      return { session, previousXp };
    }
  }

  const session = await prisma.studySession.create({
    data: { profileId, topicId, startedAt: new Date(), lastActiveAt: new Date() },
  });
  return { session, previousXp };
}

export async function endSession(profileId: string, sessionId: string) {
  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, profileId, endedAt: null },
  });
  if (!session) {
    throw new Error("Session not found");
  }
  return finalizeSession(session, new Date());
}

export async function getSessionHistory(profileId: string) {
  return prisma.studySession.findMany({
    where: { profileId },
    include: {
      topic: { select: { name: true, subject: { select: { name: true } } } },
    },
    orderBy: { startedAt: "desc" },
  });
}
