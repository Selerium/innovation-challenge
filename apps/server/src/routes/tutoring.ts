import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { wsManager } from "../lib/ws.ts";
import { CreateTutoringOfferSchema, CreateTutoringRequestSchema } from "@repo/shared";

const router = express.Router();

const entryInclude = {
  requester: { select: { id: true, displayName: true, avatarUrl: true } },
  tutor: { select: { id: true, displayName: true, avatarUrl: true } },
};

async function tryMatch(targetId: string) {
  const entry = await prisma.tutoringRequest.findUnique({
    where: { id: targetId },
  });
  if (!entry || entry.status !== "OPEN") return;

  const oppositeType = entry.type === "TEACH" ? "LEARN" : "TEACH";

  const match = await prisma.tutoringRequest.findFirst({
    where: {
      type: oppositeType,
      topic: entry.topic,
      grade: entry.grade,
      status: "OPEN",
      id: { not: entry.id },
    },
  });

  if (!match) return;

  await prisma.$transaction([
    prisma.tutoringRequest.update({
      where: { id: entry.id },
      data: { status: "MATCHED", tutorId: entry.type === "TEACH" ? entry.requesterId : match.requesterId, pairedId: match.id, resolvedAt: new Date() },
    }),
    prisma.tutoringRequest.update({
      where: { id: match.id },
      data: { status: "MATCHED", tutorId: match.type === "TEACH" ? match.requesterId : entry.requesterId, pairedId: entry.id, resolvedAt: new Date() },
    }),
  ]);

  const tutorId = entry.type === "TEACH" ? entry.requesterId : match.requesterId;
  const learnerId = entry.type === "LEARN" ? entry.requesterId : match.requesterId;

  const [tutorProfile, learnerProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { id: tutorId }, select: { displayName: true } }),
    prisma.profile.findUnique({ where: { id: learnerId }, select: { displayName: true } }),
  ]);

  const payload = {
    topic: entry.topic,
    grade: entry.grade,
    tutorId,
    tutorName: tutorProfile?.displayName || "A tutor",
    learnerId,
    learnerName: learnerProfile?.displayName || "A learner",
  };

  wsManager.sendToProfile(tutorId, { type: "peer_match", payload });
  wsManager.sendToProfile(learnerId, { type: "peer_match", payload });
}

// POST /api/tutoring/offer — Create a TEACH offering
router.post("/offer", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = CreateTutoringOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const profileId = req.profileId!;
    const entry = await prisma.tutoringRequest.create({
      data: {
        requesterId: profileId,
        tutorId: profileId,
        type: "TEACH",
        topic: parsed.data.topic,
        grade: parsed.data.grade,
        status: "OPEN",
      },
    });

    await tryMatch(entry.id);

    const updated = await prisma.tutoringRequest.findUnique({
      where: { id: entry.id },
      include: entryInclude,
    });

    return res.status(201).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tutoring/request — Create a LEARN request
router.post("/request", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = CreateTutoringRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const profileId = req.profileId!;
    const entry = await prisma.tutoringRequest.create({
      data: {
        requesterId: profileId,
        type: "LEARN",
        topic: parsed.data.topic,
        grade: parsed.data.grade,
        status: "OPEN",
      },
    });

    await tryMatch(entry.id);

    const updated = await prisma.tutoringRequest.findUnique({
      where: { id: entry.id },
      include: entryInclude,
    });

    return res.status(201).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tutoring/my — User's own tutoring entries
router.get("/my", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const entries = await prisma.tutoringRequest.findMany({
      where: { requesterId: req.profileId! },
      include: entryInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: entries });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tutoring/available — Available TEACH offers matching criteria
router.get("/available", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const where: any = { type: "TEACH", status: "OPEN" };
    if (req.query.topic) where.topic = req.query.topic;
    if (req.query.grade) where.grade = req.query.grade;

    const entries = await prisma.tutoringRequest.findMany({
      where,
      include: entryInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: entries });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tutoring/:id/close — Close a session (either participant)
router.post("/:id/close", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const entry = await prisma.tutoringRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!entry) {
      return res.status(404).json({ success: false, error: "Entry not found" });
    }

    const profileId = req.profileId!;
    if (entry.requesterId !== profileId && entry.tutorId !== profileId) {
      return res.status(403).json({ success: false, error: "Not a participant" });
    }

    if (entry.status !== "MATCHED") {
      return res.status(400).json({ success: false, error: "Session is not active" });
    }

    const toClose = [entry.id];
    if (entry.pairedId) toClose.push(entry.pairedId);

    await prisma.tutoringRequest.updateMany({
      where: { id: { in: toClose } },
      data: { status: "CLOSED", resolvedAt: new Date() },
    });

    if (entry.pairedId) {
      const otherId = entry.requesterId === profileId ? entry.tutorId : entry.requesterId;
      wsManager.sendToProfile(otherId, {
        type: "peer_closed",
        payload: { topic: entry.topic, grade: entry.grade, sessionId: entry.id },
      });
    }

    return res.json({ success: true, data: null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
