import { prisma } from "./prisma.ts";
import { chat } from "./ai.ts";

export type BurnoutAnalysis = {
  score: number;
  message: string;
};

const FALLBACK: BurnoutAnalysis = {
  score: 0,
  message: "Burnout analysis unavailable right now — AI access is temporarily limited.",
};

function stripJsonFence(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return (match ? match[1] : text).trim();
}

function parseScore(text: string): BurnoutAnalysis {
  try {
    const cleaned = stripJsonFence(text);
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    const parsed = JSON.parse(json);
    const score = Number(parsed.score);
    if (Number.isNaN(score)) throw new Error("bad score");
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      message: typeof parsed.message === "string" ? parsed.message : "Burnout risk detected.",
    };
  } catch {
    return { score: 0, message: FALLBACK.message };
  }
}

// Gather the data points the AI uses to assess burnout risk.
export async function collectBurnoutData(profileId: string) {
  const [subjects, sessions, submissions, tutoringRequests] = await Promise.all([
    prisma.subject.findMany({
      where: { profileId },
      include: { topic: { select: { id: true, status: true, progress: true } } },
    }),
    prisma.studySession.findMany({
      where: { profileId },
      orderBy: { startedAt: "desc" },
    }),
    prisma.assignmentSubmission.findMany({
      where: { profileId },
      select: { aiScore: true, submittedAt: true },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.tutoringRequest.findMany({
      where: { requesterId: profileId },
      select: { status: true },
    }),
  ]);

  const totalTopics = subjects.flatMap((s) => s.topic);
  const mastered = totalTopics.filter((t) => t.status === "MASTERED").length;
  const avgProgress = totalTopics.length
    ? Math.round(totalTopics.reduce((a, t) => a + t.progress, 0) / totalTopics.length)
    : 0;

  const now = Date.now();
  const recentSessions = sessions.filter((s) => now - s.startedAt.getTime() <= 14 * 86400000);
  const totalMinutes = recentSessions.reduce((a, s) => a + s.durationMinutes, 0);

  const gradedScores = submissions.map((s) => s.aiScore).filter((n): n is number => n != null);
  const avgScore = gradedScores.length
    ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)
    : null;

  return {
    subjects: subjects.length,
    topicsTotal: totalTopics.length,
    topicsMastered: mastered,
    averageProgress: avgProgress,
    studySessionsLast14Days: recentSessions.length,
    studyMinutesLast14Days: totalMinutes,
    assignmentSubmissions: submissions.length,
    averageAiScore: avgScore,
    openTutoringRequests: tutoringRequests.filter((t) => t.status === "OPEN").length,
  };
}

export function buildBurnoutPrompt(data: Awaited<ReturnType<typeof collectBurnoutData>>): string {
  return [
    "You are an educational psychology assistant analyzing student engagement data to detect burnout.",
    "Based ONLY on the data provided, estimate the likelihood (0-100) that this student is at risk of academic burnout.",
    "Consider: low or stalled progress, few or no recent study sessions, low assignment scores, dropping engagement, lack of topic mastery.",
    "",
    "STUDENT DATA (JSON):",
    JSON.stringify(data, null, 2),
    "",
    "Respond with ONLY a JSON object in this exact shape:",
    '{"score": <integer 0-100>, "message": "<short 1-2 sentence explanation>}',
    "No markdown, no extra text.",
  ].join("\n");
}

// Analyze a single profile and create/update an unresolved burnout alert.
export async function analyzeBurnout(profileId: string): Promise<BurnoutAnalysis> {
  const data = await collectBurnoutData(profileId);

  let analysis: BurnoutAnalysis;
  try {
    const text = await chat([{ role: "user", content: buildBurnoutPrompt(data) }]);
    analysis = parseScore(text);
  } catch (err: any) {
    console.warn(`[burnout] AI unavailable for ${profileId}: ${err.message}`);
    analysis = FALLBACK;
  }

  const existing = await prisma.burnoutAlert.findFirst({
    where: { profileId, resolved: false },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.burnoutAlert.update({
      where: { id: existing.id },
      data: { score: analysis.score, message: analysis.message },
    });
  } else {
    await prisma.burnoutAlert.create({
      data: {
        profileId,
        alertType: "BURNOUT",
        score: analysis.score,
        message: analysis.message,
      },
    });
  }

  return analysis;
}

// Scan all profiles that have any learning activity.
export async function scanAllBurnout(): Promise<{ scanned: number; alertsCreated: number }> {
  const profiles = await prisma.profile.findMany({
    where: { onboardingDone: true },
    select: { id: true },
  });

  let alertsCreated = 0;
  for (const p of profiles) {
    try {
      const analysis = await analyzeBurnout(p.id);
      if (analysis.score >= 50) alertsCreated += 1;
    } catch (err: any) {
      console.error(`[burnout] scan failed for ${p.id}: ${err.message}`);
    }
  }

  return { scanned: profiles.length, alertsCreated };
}
