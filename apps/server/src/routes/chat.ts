import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import { wsManager } from "../lib/ws.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";

const router = express.Router();

function getOtherId(profileIds: unknown, profileId: string): string | null {
  if (!Array.isArray(profileIds)) return null;
  const ids = profileIds as string[];
  return ids.find((p) => p !== profileId) ?? null;
}

async function findConversation(conversationId: string, profileId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;
  const profileIds = Array.isArray(conversation.profileIds) ? (conversation.profileIds as string[]) : [];
  if (!profileIds.includes(profileId)) return null;
  return conversation;
}

// GET /api/chat/conversations — list the user's conversations
router.get("/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;

    const conversations = await prisma.conversation.findMany({
      where: { profileIds: { array_contains: profileId } },
      orderBy: { updatedAt: "desc" },
    });

    if (conversations.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const conversationIds = conversations.map((c) => c.id);

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { sentAt: "asc" },
    });

    const messagesByConv = new Map<string, typeof messages>();
    for (const msg of messages) {
      if (!messagesByConv.has(msg.conversationId)) {
        messagesByConv.set(msg.conversationId, []);
      }
      messagesByConv.get(msg.conversationId)!.push(msg);
    }

    const otherIds = conversations
      .map((c) => getOtherId(c.profileIds, profileId))
      .filter((id): id is string => !!id);

    const profiles = await prisma.profile.findMany({
      where: { id: { in: Array.from(new Set(otherIds)) } },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const data = conversations.map((conversation) => {
      const otherId = getOtherId(conversation.profileIds, profileId);
      const peer = otherId ? profileMap.get(otherId) : null;
      const convMessages = messagesByConv.get(conversation.id) ?? [];

      const last = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter((m) => m.senderId !== profileId && !m.read).length;

      return {
        conversationId: conversation.id,
        status: conversation.status,
        peer: peer
          ? { id: peer.id, displayName: peer.displayName, avatarUrl: peer.avatarUrl }
          : null,
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.sentAt ?? conversation.createdAt,
        unreadCount,
      };
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/chat/:conversationId/messages — get messages in a conversation
router.get("/:conversationId/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;
    const conversationId = req.params.conversationId as string;

    const conversation = await findConversation(conversationId, profileId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    const profileIds = conversation.profileIds as string[];
    const otherId = getOtherId(profileIds, profileId);

    await prisma.chatMessage.updateMany({
      where: { conversationId, senderId: otherId ?? "", read: false },
      data: { read: true },
    });

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { sentAt: "asc" },
    });

    return res.json({ success: true, data: messages });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/chat/:conversationId/send — send a message
router.post("/:conversationId/send", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;
    const conversationId = req.params.conversationId as string;
    const { content } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    const conversation = await findConversation(conversationId, profileId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    if (conversation.status !== "ACTIVE") {
      return res.status(400).json({ success: false, error: "Conversation is closed" });
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: profileId,
        content: content.trim(),
      },
    });

    await prisma.conversation.update({ where: { id: conversationId }, data: {} });

    const profileIds = conversation.profileIds as string[];
    const otherId = getOtherId(profileIds, profileId);

    if (otherId) {
      wsManager.sendToProfile(otherId, {
        type: "new_message",
        payload: {
          id: message.id,
          conversationId,
          senderId: profileId,
          content: message.content,
          sentAt: message.sentAt.toISOString(),
        },
      });
    }

    return res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/chat/messages/:messageId — delete a message you sent
router.delete("/messages/:messageId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const messageId = req.params.messageId as string;
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ success: false, error: "Message not found" });
    if (message.senderId !== req.profileId!) return res.status(403).json({ success: false, error: "Not your message" });

    await prisma.chatMessage.delete({ where: { id: messageId } });
    return res.json({ success: true, data: null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
