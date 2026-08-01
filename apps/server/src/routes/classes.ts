import express from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { CreateClassSchema, JoinClassSchema } from "@repo/shared";

const router = express.Router();

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(len = 6) {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => INVITE_CHARS[b % INVITE_CHARS.length]).join("");
}

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    const existing = await prisma.eduClass.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique invite code");
}

// POST /api/classes — Create a class (teacher only)
router.post("/", requireAuth, requireRole(["TEACHER"]), async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = CreateClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const eduClass = await prisma.eduClass.create({
      data: {
        name: parsed.data.name,
        inviteCode: await uniqueInviteCode(),
        teacherId: req.profileId!,
      },
    });

    return res.status(201).json({ success: true, data: eduClass });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/classes — List classes (created or joined)
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.profileId! },
      select: { user: { select: { role: true } } },
    });

    const isTeacher = profile?.user?.role === "TEACHER";

    if (isTeacher) {
      const classes = await prisma.eduClass.findMany({
        where: { teacherId: req.profileId! },
        include: {
          teacher: { select: { id: true, displayName: true } },
          _count: { select: { member: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        success: true,
        data: classes.map((c) => ({
          id: c.id,
          name: c.name,
          inviteCode: c.inviteCode,
          teacherId: c.teacherId,
          teacherName: c.teacher.displayName,
          memberCount: c._count.member,
          userRole: "TEACHER",
          createdAt: c.createdAt.toISOString(),
        })),
      });
    }

    const classes = await prisma.eduClass.findMany({
      where: { member: { some: { profileId: req.profileId! } } },
      include: {
        teacher: { select: { id: true, displayName: true } },
        _count: { select: { member: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: classes.map((c) => ({
        id: c.id,
        name: c.name,
        inviteCode: c.inviteCode,
        teacherId: c.teacherId,
        teacherName: c.teacher.displayName,
        memberCount: c._count.member,
        userRole: "MEMBER",
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/classes/join — Join a class by invite code
router.post("/join", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = JoinClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const eduClass = await prisma.eduClass.findUnique({
      where: { inviteCode: parsed.data.inviteCode.trim().toUpperCase() },
    });

    if (!eduClass) {
      return res.status(404).json({ success: false, error: "Invalid invite code" });
    }

    if (eduClass.teacherId === req.profileId) {
      return res.status(400).json({ success: false, error: "You can't join your own class" });
    }

    const existing = await prisma.classMember.findUnique({
      where: { classId_profileId: { classId: eduClass.id, profileId: req.profileId! } },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: "You are already in this class" });
    }

    await prisma.classMember.create({
      data: { classId: eduClass.id, profileId: req.profileId! },
    });

    return res.status(201).json({ success: true, data: eduClass });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/classes/:id — Class detail + members
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const eduClass = await prisma.eduClass.findUnique({
      where: { id: req.params.id as string },
      include: {
        teacher: { select: { id: true, displayName: true } },
        member: {
          include: {
            profile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                user: { select: { role: true } },
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!eduClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }

    const isTeacher = eduClass.teacherId === req.profileId;
    const isMember = eduClass.member.some((m) => m.profileId === req.profileId);

    if (!isTeacher && !isMember) {
      return res.status(403).json({ success: false, error: "Not a member of this class" });
    }

    return res.json({
      success: true,
      data: {
        id: eduClass.id,
        name: eduClass.name,
        inviteCode: eduClass.inviteCode,
        teacherId: eduClass.teacherId,
        teacherName: eduClass.teacher.displayName,
        createdAt: eduClass.createdAt.toISOString(),
        isTeacher,
        members: eduClass.member.map((m) => ({
          id: m.profileId,
          displayName: m.profile.displayName,
          avatarUrl: m.profile.avatarUrl,
          role: m.profile.user.role,
          joinedAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/classes/:id/leave — Leave a class
router.post("/:id/leave", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const eduClass = await prisma.eduClass.findUnique({ where: { id: req.params.id as string } });

    if (!eduClass) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }

    if (eduClass.teacherId === req.profileId) {
      return res.status(400).json({ success: false, error: "Teachers can't leave their own class — delete it instead" });
    }

    const member = await prisma.classMember.findUnique({
      where: { classId_profileId: { classId: eduClass.id, profileId: req.profileId! } },
    });

    if (!member) {
      return res.status(404).json({ success: false, error: "You are not a member of this class" });
    }

    await prisma.classMember.delete({ where: { id: member.id } });

    return res.json({ success: true, data: null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/classes/:id — Delete a class (teacher only)
router.delete("/:id", requireAuth, requireRole(["TEACHER"]), async (req: AuthenticatedRequest, res) => {
  try {
    const eduClass = await prisma.eduClass.findFirst({
      where: { id: req.params.id as string, teacherId: req.profileId! },
    });

    if (!eduClass) {
      return res.status(403).json({ success: false, error: "You don't own this class" });
    }

    await prisma.eduClass.delete({ where: { id: eduClass.id } });

    return res.json({ success: true, data: null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
