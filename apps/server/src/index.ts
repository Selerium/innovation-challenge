import express from "express";
import cors from "cors";
import { createServer } from "http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { prisma } from "./lib/prisma.ts";
import { wsManager } from "./lib/ws.ts";
import profileRoutes from "./routes/profile.ts";
import aiRoutes from "./routes/ai.ts";
import subjectRoutes from "./routes/subjects.ts";
import topicRoutes from "./routes/topics.ts";
import assignmentRoutes from "./routes/assignments.ts";
import tutoringRoutes from "./routes/tutoring.ts";
import chatRoutes from "./routes/chat.ts";
import classRoutes from "./routes/classes.ts";
import teacherRoutes from "./routes/teacher.ts";
import burnoutRoutes from "./routes/burnout.ts";
import studySessionRoutes from "./routes/study-sessions.ts";
import gamificationRoutes from "./routes/gamification.ts";
import { startDailyScan } from "./jobs/daily-scan.ts";
import { startSessionSweeper } from "./jobs/session-sweeper.ts";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// CORS must come first so preflight OPTIONS requests get headers
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Better Auth handler must come before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Session + profile endpoint (checks onboarding status)
app.get("/api/session", async (req, res) => {
  try {
    const { fromNodeHeaders } = await import("better-auth/node");
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.json({ success: true, data: null });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        xp: true,
        level: true,
        onboardingDone: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role,
        },
        profile,
      },
    });
  } catch (error: any) {
    return res.json({ success: true, data: null });
  }
});

// Routes
app.get("/api/auth/ws-token", async (req, res) => {
  const { fromNodeHeaders } = await import("better-auth/node");
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session?.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return res.status(401).json({ success: false, error: "No profile" });
  }
  const token = wsManager.createToken(profile.id);
  return res.json({ success: true, data: { token } });
});

app.use("/api/profile", profileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api", topicRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/tutoring", tutoringRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/burnout", burnoutRoutes);
app.use("/api/study-sessions", studySessionRoutes);
app.use("/api/gamification", gamificationRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

wsManager.init(server);

startDailyScan();
startSessionSweeper();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
