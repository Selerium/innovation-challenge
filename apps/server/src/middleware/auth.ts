import express from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.ts";
import { prisma } from "../lib/prisma.ts";

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

export interface AuthenticatedRequest extends Request {
  userId?: string;
  profileId?: string;
  userRole?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    req.userId = session.user.id;
    req.userRole = (session.user as any).role;

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, onboardingDone: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    req.profileId = profile.id;

    if (!profile.onboardingDone && req.path !== "/api/profile" && req.method !== "PUT") {
      return res.status(403).json({
        success: false,
        error: "Onboarding required",
        code: "ONBOARDING_REQUIRED",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    next();
  };
}
