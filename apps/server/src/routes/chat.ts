import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import { wsManager } from "../lib/ws.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";

const router = express.Router();

router.get("/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;

    const sent = await prisma.chatMessage.findMany({
      where: { senderId: profileId },
      include: { receiver: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { sentAt: "desc" },
    });

    const received = await prisma.chatMessage.findMany({
      where: { receiverId: profileId },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { sentAt: "desc" },
    });

    const peerMap = new Map<string, { id: string; displayName: string; avatarUrl: string | null; lastMessage: string; lastMessageAt: Date; unreadCount: number }>();

    for (const msg of sent) {
      const pid = msg.receiverId;
      if (!peerMap.has(pid)) {
        peerMap.set(pid, { ...msg.receiver, lastMessage: msg.content, lastMessageAt: msg.sentAt, unreadCount: 0 });
      }
    }

    for (const msg of received) {
      const pid = msg.senderId;
      if (!peerMap.has(pid)) {
        peerMap.set(pid, { ...msg.sender, lastMessage: msg.content, lastMessageAt: msg.sentAt, unreadCount: msg.read ? 0 : 1 });
      } else {
        const entry = peerMap.get(pid)!;
        if (!msg.read) entry.unreadCount += 1;
        if (msg.sentAt > entry.lastMessageAt) {
          entry.lastMessage = msg.content;
          entry.lastMessageAt = msg.sentAt;
        }
      }
    }

    const peers = Array.from(peerMap.values()).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    return res.json({ success: true, data: peers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:partnerId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;
    const partnerId = req.params.partnerId as string;

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: profileId, receiverId: partnerId },
          { senderId: partnerId, receiverId: profileId },
        ],
      },
      orderBy: { sentAt: "asc" },
    });

    await prisma.chatMessage.updateMany({
      where: { senderId: partnerId, receiverId: profileId, read: false },
      data: { read: true },
    });

    return res.json({ success: true, data: messages });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/:partnerId/send", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;
    const partnerId = req.params.partnerId as string;
    const { content } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: profileId,
        receiverId: partnerId,
        content: content.trim(),
      },
    });

    wsManager.sendToProfile(partnerId, {
      type: "new_message",
      payload: {
        id: message.id,
        senderId: profileId,
        content: message.content,
        sentAt: message.sentAt.toISOString(),
      },
    });

    return res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

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
