import express from "express";
import { prisma } from "../lib/prisma.ts";
import { chat } from "../lib/ai.ts";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { GenerateAssignmentSchema, SubmitAssignmentAnswersSchema } from "@repo/shared";
import type { ChatMessage } from "../lib/ai.ts";

const router = express.Router();

function compactChatSummary(messages: ChatMessage[]): string {
  const lines: string[] = [];
  for (const m of messages) {
    const prefix = m.role === "user" ? "Student" : "Tutor";
    const text = m.content.length > 200 ? m.content.slice(0, 200) + "..." : m.content;
    lines.push(`${prefix}: ${text}`);
  }
  return lines.join("\n");
}

// POST /api/assignments/generate — Generate a Q&A assignment for a topic
router.post("/generate", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = GenerateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { subjectId, topicId } = parsed.data;
    const profileId = req.profileId!;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });

    if (!subject || !topic) {
      return res.status(404).json({ success: false, error: "Subject or topic not found" });
    }

    // Load topic explanation and compacted chat context
    const explanation = topic.explanation || "";
    const conversation = await prisma.aiConversation.findUnique({
      where: { profileId_subjectId: { profileId, subjectId } },
    });
    const allMessages = (conversation?.messages || []) as ChatMessage[];
    const topicMessages = allMessages.filter((m) => m.topicId === topicId);
    const chatSummary = compactChatSummary(topicMessages);

    // Build prompt
    let prompt = `Generate 5 practice questions for a grade ${subject.grade} student studying "${topic.name}" in ${subject.name}.\n\n`;
    if (explanation) {
      prompt += `Topic notes:\n${explanation}\n\n`;
    }
    if (chatSummary) {
      prompt += `Recent study session:\n${chatSummary}\n\n`;
    }
    prompt += `For each question provide a clear question and the correct answer at the student's grade level.\n\n`;
    prompt += `Return ONLY valid JSON (no markdown, no code fences):\n{"questions": [{"id": "q1", "question": "...", "answer": "..."}, {"id": "q2", "question": "...", "answer": "..."}, {"id": "q3", "question": "...", "answer": "..."}, {"id": "q4", "question": "...", "answer": "..."}, {"id": "q5", "question": "...", "answer": "..."}]}`;

    const response = await chat([{ role: "user", content: prompt }]);

    let questions: { id: string; question: string; answer: string }[];
    try {
      const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      questions = parsed.questions || [];
    } catch {
      questions = [
        { id: "q1", question: "Explain the key concepts of " + topic.name, answer: response.slice(0, 500) },
      ];
    }

    const assignment = await prisma.assignment.create({
      data: {
        subjectId,
        creatorId: profileId,
        title: `${topic.name} - Practice Questions`,
        description: `AI-generated questions based on ${topic.name}`,
        content: { questions },
      },
    });

    return res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    console.error("Generate assignment error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate assignment" });
  }
});

// GET /api/assignments — List user's assignments
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { creatorId: req.profileId! },
      include: { subject: { select: { name: true, grade: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: assignments });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/assignments/:id — Get single assignment with submission
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: { id: req.params.id, creatorId: req.profileId! },
      include: { subject: { select: { name: true, grade: true } } },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, error: "Assignment not found" });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_profileId: { assignmentId: assignment.id, profileId: req.profileId! } },
    });

    return res.json({ success: true, data: { ...assignment, submission } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/assignments/:id/submit — Submit answers
router.post("/:id/submit", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = SubmitAssignmentAnswersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id: req.params.id, creatorId: req.profileId! },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, error: "Assignment not found" });
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_profileId: { assignmentId: assignment.id, profileId: req.profileId! } },
      create: {
        assignmentId: assignment.id,
        profileId: req.profileId!,
        content: JSON.stringify(parsed.data.answers),
        status: "SUBMITTED",
      },
      update: {
        content: JSON.stringify(parsed.data.answers),
        status: "SUBMITTED",
        submittedAt: new Date(),
        aiScore: null,
        aiFeedback: null,
      },
    });

    return res.json({ success: true, data: submission });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
