import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { CreateSubjectSchema } from "@repo/shared";

const router = express.Router();

// POST /api/subjects — Create a subject
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = CreateSubjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { name, grade, scope } = parsed.data;

    const existing = await prisma.subject.findUnique({
      where: { profileId_name_grade: { profileId: req.profileId!, name, grade } },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: "You already have this subject" });
    }

    const subject = await prisma.subject.create({
      data: {
        profileId: req.profileId!,
        name,
        grade,
        scope: scope || null,
      },
    });

    return res.status(201).json({ success: true, data: subject });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subjects — List user's subjects
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { profileId: req.profileId! },
      include: {
        topic: {
          select: { id: true, name: true, status: true, progress: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: subjects });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subjects/:id — Get single subject with topics
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: { id: req.params.id as string, profileId: req.profileId! },
      include: {
        topic: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    return res.json({ success: true, data: subject });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/subjects/:id — Update subject
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { scope } = req.body;

    const subject = await prisma.subject.findFirst({
      where: { id: req.params.id as string, profileId: req.profileId! },
    });

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    const updated = await prisma.subject.update({
      where: { id: subject.id },
      data: { scope: scope ?? subject.scope },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/subjects/:id — Delete subject
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: { id: req.params.id as string, profileId: req.profileId! },
    });

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    await prisma.subject.delete({ where: { id: subject.id } });

    return res.json({ success: true, data: null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
