import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";

const router = express.Router();

const AT_RISK_THRESHOLD = 50;

function avg(values: number[]): number | null {
  const valid = values.filter((v) => v != null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

// GET /api/teacher/analytics — Per-class aggregates (teacher only)
router.get("/analytics", requireAuth, requireRole(["TEACHER"]), async (req: AuthenticatedRequest, res) => {
  try {
    const classes = await prisma.eduClass.findMany({
      where: { teacherId: req.profileId! },
      include: {
        _count: { select: { member: true } },
        member: { select: { profileId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const analytics = [];

    for (const eduClass of classes) {
      const memberIds = eduClass.member.map((m) => m.profileId);

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { profileId: { in: memberIds } },
        select: { aiScore: true, teacherScore: true, assignmentId: true },
      });

      const alerts = await prisma.burnoutAlert.findMany({
        where: { profileId: { in: memberIds }, resolved: false },
        select: { profileId: true, score: true },
      });

      const atRiskProfiles = new Set(
        alerts.filter((a) => a.score >= AT_RISK_THRESHOLD).map((a) => a.profileId)
      );

      analytics.push({
        class: {
          id: eduClass.id,
          name: eduClass.name,
          inviteCode: eduClass.inviteCode,
          memberCount: eduClass._count.member,
        },
        assignments: new Set(submissions.map((s) => s.assignmentId)).size,
        submissions: submissions.length,
        avgAiScore: avg(submissions.map((s) => s.aiScore!)),
        avgTeacherScore: avg(submissions.map((s) => s.teacherScore!)),
        atRiskCount: atRiskProfiles.size,
      });
    }

    return res.json({ success: true, data: analytics });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/teacher/classes/:classId/students — Student summaries per class
router.get(
  "/classes/:classId/students",
  requireAuth,
  requireRole(["TEACHER"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const eduClass = await prisma.eduClass.findFirst({
        where: { id: req.params.classId as string, teacherId: req.profileId! },
        include: { member: { select: { profileId: true } } },
      });

      if (!eduClass) {
        return res.status(403).json({ success: false, error: "Class not found or not yours" });
      }

      const memberIds = eduClass.member.map((m) => m.profileId);

      const profiles = await prisma.profile.findMany({
        where: { id: { in: memberIds } },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          xp: true,
          subjects: {
            select: { id: true, topic: { select: { status: true } } },
          },
          assignmentSubmission: { select: { aiScore: true } },
        },
      });

      const alerts = await prisma.burnoutAlert.findMany({
        where: { profileId: { in: memberIds }, resolved: false },
        select: { profileId: true, score: true },
      });

      const maxBurnout: Record<string, number> = {};
      for (const a of alerts) {
        maxBurnout[a.profileId] = Math.max(maxBurnout[a.profileId] ?? 0, a.score);
      }

      const summaries = profiles.map((p) => {
        const topicsMastered = p.subjects
          .flatMap((s) => s.topic)
          .filter((t) => t.status === "MASTERED").length;
        const scores = p.assignmentSubmission.map((s) => s.aiScore!);
        const burnoutScore = maxBurnout[p.id] ?? null;

        return {
          profileId: p.id,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          level: p.level,
          xp: p.xp,
          subjects: p.subjects.length,
          topicsMastered,
          avgAssignmentScore: avg(scores),
          burnoutScore,
          atRisk: burnoutScore != null && burnoutScore >= AT_RISK_THRESHOLD,
        };
      });

      return res.json({ success: true, data: summaries });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

// GET /api/teacher/classes/:classId/submissions — Read-only submission reviews
router.get(
  "/classes/:classId/submissions",
  requireAuth,
  requireRole(["TEACHER"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const eduClass = await prisma.eduClass.findFirst({
        where: { id: req.params.classId as string, teacherId: req.profileId! },
        include: { member: { select: { profileId: true } } },
      });

      if (!eduClass) {
        return res.status(403).json({ success: false, error: "Class not found or not yours" });
      }

      const memberIds = eduClass.member.map((m) => m.profileId);

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { profileId: { in: memberIds } },
        include: {
          profile: { select: { displayName: true } },
          assignment: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
      });

      return res.json({
        success: true,
        data: submissions.map((s) => ({
          id: s.id,
          assignmentTitle: s.assignment.title,
          studentName: s.profile.displayName,
          content: s.content,
          aiScore: s.aiScore,
          aiFeedback: s.aiFeedback,
          teacherScore: s.teacherScore,
          teacherComment: s.teacherComment,
          status: s.status,
          submittedAt: s.submittedAt.toISOString(),
        })),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

// GET /api/teacher/students/:profileId — Student drill-down
router.get(
  "/students/:profileId",
  requireAuth,
  requireRole(["TEACHER"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const targetId = req.params.profileId as string;

      const inClass = await prisma.eduClass.findFirst({
        where: {
          teacherId: req.profileId!,
          member: { some: { profileId: targetId } },
        },
      });

      if (!inClass) {
        return res.status(403).json({ success: false, error: "Student not in your classes" });
      }

      const profile = await prisma.profile.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          xp: true,
          bio: true,
        },
      });

      if (!profile) {
        return res.status(404).json({ success: false, error: "Student not found" });
      }

      const subjects = await prisma.subject.findMany({
        where: { profileId: targetId },
        include: { topic: { select: { id: true, status: true, progress: true } } },
        orderBy: { createdAt: "desc" },
      });

      const assignments = await prisma.assignmentSubmission.findMany({
        where: { profileId: targetId },
        include: {
          assignment: { select: { title: true, subject: { select: { name: true } } } },
        },
        orderBy: { submittedAt: "desc" },
      });

      const burnoutAlerts = await prisma.burnoutAlert.findMany({
        where: { profileId: targetId },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        success: true,
        data: {
          profile,
          subjects: subjects.map((s) => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            topicsTotal: s.topic.length,
            topicsMastered: s.topic.filter((t) => t.status === "MASTERED").length,
            averageProgress: s.topic.length
              ? Math.round(s.topic.reduce((a, t) => a + t.progress, 0) / s.topic.length)
              : 0,
          })),
          assignments: assignments.map((a) => ({
            id: a.id,
            title: a.assignment.title,
            subjectName: a.assignment.subject.name,
            aiScore: a.aiScore,
            teacherScore: a.teacherScore,
            status: a.status,
            submittedAt: a.submittedAt.toISOString(),
          })),
          burnoutAlerts: burnoutAlerts.map((b) => ({
            id: b.id,
            score: b.score,
            message: b.message,
            resolved: b.resolved,
            createdAt: b.createdAt.toISOString(),
          })),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
