import express from "express";
import { prisma } from "../lib/prisma.ts";
import { chat } from "../lib/ai.ts";
import { buildStudyPrompt, buildSuggestPrompt, buildDeepDivePrompt } from "../lib/ai-prompts.ts";
import { requireAuth } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { SendAiMessageSchema } from "@repo/shared";

const router = express.Router();

// POST /api/ai/chat — Send message, get AI response
router.post("/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = SendAiMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { subjectId, message, topicId } = parsed.data;
    const profileId = req.profileId!;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }

    let topicName: string | undefined;
    if (topicId) {
      const topic = await prisma.topic.findUnique({ where: { id: topicId } });
      if (!topic) return res.status(404).json({ success: false, error: "Topic not found" });
      topicName = topic.name;
    }

    // Load or create conversation
    let conversation = await prisma.aiConversation.findUnique({
      where: { profileId_subjectId: { profileId, subjectId } },
    });

    const messages: any[] = conversation ? (conversation.messages as any[]) : [];

    // Build system prompt from subject context
    const systemPrompt = await buildStudyPrompt(profileId, subjectId, topicName);

    // Add user message
    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date().toISOString(),
      topicId: topicId || null,
    };
    messages.push(userMessage);

    // Get AI response with context (last 20 messages to stay within token limits)
    const recentMessages = messages.slice(-20);
    const aiResponse = await chat(recentMessages, systemPrompt);

    const assistantMessage = {
      role: "assistant" as const,
      content: aiResponse,
      timestamp: new Date().toISOString(),
      topicId: topicId || null,
    };
    messages.push(assistantMessage);

    // Save conversation
    if (conversation) {
      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { messages },
      });
    } else {
      await prisma.aiConversation.create({
        data: {
          profileId,
          subjectId,
          messages,
        },
      });
    }

    return res.json({
      success: true,
      data: { response: aiResponse },
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return res.status(500).json({ success: false, error: error.message || "AI chat failed" });
  }
});

// POST /api/ai/suggest-topics — Suggest branching topics
router.post("/suggest-topics", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { subjectId, topicId } = req.body;
    if (!subjectId || !topicId) {
      return res.status(400).json({ success: false, error: "subjectId and topicId required" });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });

    if (!subject || !topic) {
      return res.status(404).json({ success: false, error: "Subject or topic not found" });
    }

    const prompt = buildSuggestPrompt(subject.name, topic.name, subject.scope);
    const response = await chat([{ role: "user", content: prompt }]);

    // Parse suggestions from response
    const suggestions = parseSuggestions(response);

    // Save suggestions to topic
    await prisma.topic.update({
      where: { id: topicId },
      data: { suggestions },
    });

    return res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error: any) {
    console.error("AI suggest error:", error);
    return res.status(500).json({ success: false, error: error.message || "Suggestion failed" });
  }
});

// POST /api/ai/deep-dive — Get detailed explanation on a topic
router.post("/deep-dive", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { subjectId, topicId } = req.body;
    if (!subjectId || !topicId) {
      return res.status(400).json({ success: false, error: "subjectId and topicId required" });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });

    if (!subject || !topic) {
      return res.status(404).json({ success: false, error: "Subject or topic not found" });
    }

    const prompt = buildDeepDivePrompt(subject.name, topic.name);
    const response = await chat([{ role: "user", content: prompt }]);

    await prisma.topic.update({
      where: { id: topicId },
      data: { explanation: response },
    });

    return res.json({
      success: true,
      data: { explanation: response },
    });
  } catch (error: any) {
    console.error("AI deep dive error:", error);
    return res.status(500).json({ success: false, error: error.message || "Deep dive failed" });
  }
});

// GET /api/ai/history/:subjectId — Get conversation history for a subject
// Optional ?topicId=... to filter messages by topic
router.get("/history/:subjectId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const conversation = await prisma.aiConversation.findUnique({
      where: {
        profileId_subjectId: {
          profileId: req.profileId!,
          subjectId: req.params.subjectId as string,
        },
      },
    });

    const allMessages = (conversation?.messages || []) as any[];
    const topicId = req.query.topicId as string | undefined;

    const messages = topicId
      ? allMessages.filter((m: any) => m.topicId === topicId)
      : allMessages;

    return res.json({
      success: true,
      data: { messages },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

function parseSuggestions(response: string): { name: string; description: string; connection: string }[] {
  const suggestions: { name: string; description: string; connection: string }[] = [];
  const blocks = response.split(/(?=TOPIC:)/);

  for (const block of blocks) {
    const nameMatch = block.match(/TOPIC:\s*(.+)/);
    const descMatch = block.match(/DESCRIPTION:\s*(.+)/);
    const connMatch = block.match(/CONNECTION:\s*(.+)/);

    if (nameMatch) {
      suggestions.push({
        name: nameMatch[1].trim(),
        description: descMatch?.[1]?.trim() || "",
        connection: connMatch?.[1]?.trim() || "",
      });
    }
  }

  return suggestions.length > 0 ? suggestions : [{ name: response.slice(0, 100), description: "", connection: "" }];
}

export default router;
