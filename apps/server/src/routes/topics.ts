import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { CreateTopicSchema, UpdateTopicSchema } from "@repo/shared";
import { addXp, XP } from "../lib/gamification.ts";

const router = express.Router();

// POST /api/subjects/:subjectId/topics — Add topic to subject
router.post("/subjects/:subjectId/topics", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = CreateTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const subject = await prisma.subject.findFirst({
      where: { id: req.params.subjectId as string, profileId: req.profileId! },
    });

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    const topic = await prisma.topic.create({
      data: {
        subjectId: subject.id,
        name: parsed.data.name,
      },
    });

    return res.status(201).json({ success: true, data: topic });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subjects/:subjectId/topics — List topics for subject
router.get("/subjects/:subjectId/topics", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: { id: req.params.subjectId as string, profileId: req.profileId! },
    });

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    const topics = await prisma.topic.findMany({
      where: { subjectId: subject.id },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ success: true, data: topics });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/topics/:id — Update topic progress/status
router.put("/topics/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = UpdateTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const topic = await prisma.topic.findFirst({
      where: { id: req.params.id as string },
      include: { subject: { select: { profileId: true } } },
    });

    if (!topic || topic.subject.profileId !== req.profileId) {
      return res.status(404).json({ success: false, error: "Topic not found" });
    }

    const wasMastered = topic.status === "MASTERED";

    const updated = await prisma.topic.update({
      where: { id: topic.id },
      data: parsed.data,
    });

    let xp: any = null;
    if (!wasMastered && updated.status === "MASTERED") {
      const result = await addXp(req.profileId!, XP.TOPIC_MASTERED, "TOPIC_MASTERED", updated.id);
      if (result) {
        xp = { xpAwarded: result.xpAwarded, totalXp: result.totalXp, level: result.level, leveledUp: result.leveledUp };
      }
    }

    return res.json({ success: true, data: { ...updated, xp } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
