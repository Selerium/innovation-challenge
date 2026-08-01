import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";

const router = express.Router();

// GET /api/gamification/leaderboard — Top students by XP + requester's rank
router.get("/leaderboard", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { user: { role: "STUDENT" } },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        xp: true,
        level: true,
        subjects: { select: { topic: { select: { status: true } } } },
      },
    });

    const ranked = profiles
      .map((p) => ({
        profileId: p.id,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        level: p.level,
        xp: p.xp,
        topicsMastered: p.subjects
          .flatMap((s) => s.topic)
          .filter((t) => t.status === "MASTERED").length,
      }))
      .sort(
        (a, b) => b.xp - a.xp || b.topicsMastered - a.topicsMastered || a.displayName.localeCompare(b.displayName)
      );

    const yourIndex = ranked.findIndex((e) => e.profileId === req.profileId);

    const entries = ranked.slice(0, 10).map((e, i) => ({
      ...e,
      rank: i + 1,
      isYou: e.profileId === req.profileId,
    }));

    return res.json({
      success: true,
      data: {
        entries,
        yourRank: yourIndex >= 0 ? yourIndex + 1 : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/gamification/transactions — Recent XP activity for the current user
router.get("/transactions", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const transactions = await prisma.xpTransaction.findMany({
      where: { profileId: req.profileId! },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.json({
      success: true,
      data: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        refId: t.refId,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
