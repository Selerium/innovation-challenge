import express from "express";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { StudySessionHeartbeatSchema } from "@repo/shared";
import { heartbeat, endSession, getSessionHistory } from "../lib/study-sessions.ts";

const router = express.Router();

// POST /api/study-sessions/heartbeat — Record activity on a topic
router.post("/heartbeat", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = StudySessionHeartbeatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { session, previousXp } = await heartbeat(req.profileId!, parsed.data.topicId);

    return res.json({
      success: true,
      data: {
        id: session.id,
        topicId: session.topicId,
        startedAt: session.startedAt.toISOString(),
        lastActiveAt: session.lastActiveAt?.toISOString() ?? null,
        endedAt: session.endedAt?.toISOString() ?? null,
        previousXp: previousXp
          ? {
              xpAwarded: previousXp.xpAwarded,
              totalXp: previousXp.totalXp,
              level: previousXp.level,
              leveledUp: previousXp.leveledUp,
            }
          : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/study-sessions/:id/end — End the active session explicitly
router.post("/:id/end", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { session, xpResult } = await endSession(req.profileId!, req.params.id as string);

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        durationMinutes: session.durationMinutes,
        xpAwarded: xpResult?.xpAwarded ?? 0,
        totalXp: xpResult?.totalXp,
        level: xpResult?.level,
        leveledUp: xpResult?.leveledUp ?? false,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/study-sessions — History + active session
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const sessions = await getSessionHistory(req.profileId!);

    return res.json({
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        profileId: s.profileId,
        topicId: s.topicId,
        topicName: s.topic.name,
        subjectName: s.topic.subject.name,
        durationMinutes: s.durationMinutes,
        xpEarned: s.xpEarned,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt?.toISOString() ?? null,
        active: s.endedAt === null,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
