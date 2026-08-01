import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { analyzeBurnout } from "../lib/burnout.ts";
import { ResolveBurnoutSchema } from "@repo/shared";

const router = express.Router();

// POST /api/burnout/scan — Manually trigger a burnout scan for the current user
router.post("/scan", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const analysis = await analyzeBurnout(req.profileId!);

    const alert = await prisma.burnoutAlert.findFirst({
      where: { profileId: req.profileId!, resolved: false },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: {
        scanned: 1,
        alertsCreated: analysis.score >= 50 ? 1 : 0,
        alert: alert
          ? {
              id: alert.id,
              profileId: alert.profileId,
              alertType: alert.alertType,
              message: alert.message,
              score: alert.score,
              resolved: alert.resolved,
              createdAt: alert.createdAt.toISOString(),
            }
          : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/burnout/alerts — List current user's alerts
router.get("/alerts", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const alerts = await prisma.burnoutAlert.findMany({
      where: { profileId: req.profileId! },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: alerts.map((a) => ({
        id: a.id,
        profileId: a.profileId,
        alertType: a.alertType,
        message: a.message,
        score: a.score,
        resolved: a.resolved,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/burnout/alerts/:id — Resolve an alert
router.patch("/alerts/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = ResolveBurnoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const alert = await prisma.burnoutAlert.findFirst({
      where: { id: req.params.id as string, profileId: req.profileId! },
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: "Alert not found" });
    }

    const updated = await prisma.burnoutAlert.update({
      where: { id: alert.id },
      data: { resolved: parsed.data.resolved ?? true },
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        profileId: updated.profileId,
        alertType: updated.alertType,
        message: updated.message,
        score: updated.score,
        resolved: updated.resolved,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
