import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { OnboardingSchema } from "@repo/shared";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.profileId },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    return res.json({ success: true, data: profile });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = OnboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { displayName, bio, role } = parsed.data;

    await prisma.user.update({
      where: { id: req.userId },
      data: { role },
    });

    const profile = await prisma.profile.update({
      where: { id: req.profileId },
      data: {
        displayName,
        bio: bio || null,
        onboardingDone: true,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    return res.json({ success: true, data: profile });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        xp: true,
        level: true,
        createdAt: true,
        user: {
          select: { role: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    return res.json({ success: true, data: profile });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
