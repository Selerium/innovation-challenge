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

async function findPairConversation(aId: string, bId: string, status?: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      profileIds: { array_contains: aId },
      ...(status ? { status } : {}),
    },
  });
  return (
    conversations.find((c) => {
      const ids = Array.isArray(c.profileIds) ? (c.profileIds as string[]) : [];
      return ids.length === 2 && ids.includes(aId) && ids.includes(bId);
    }) ?? null
  );
}

async function shareAClass(aId: string, bId: string): Promise<boolean> {
  const aClasses = await prisma.classMember.findMany({
    where: { profileId: aId },
    select: { classId: true },
  });
  const aClassIds = aClasses.map((m) => m.classId);

  const sharedMember = await prisma.classMember.findFirst({
    where: { profileId: bId, classId: { in: aClassIds } },
    select: { id: true },
  });
  if (sharedMember) return true;

  const taughtByB = await prisma.eduClass.findFirst({
    where: { id: { in: aClassIds }, teacherId: bId },
    select: { id: true },
  });
  if (taughtByB) return true;

  const bClasses = await prisma.classMember.findMany({
    where: { profileId: bId },
    select: { classId: true },
  });
  const taughtByA = await prisma.eduClass.findFirst({
    where: { id: { in: bClasses.map((m) => m.classId) }, teacherId: aId },
    select: { id: true },
  });
  return !!taughtByA;
}

function conversationSummary(
  conversation: { id: string; profileIds: unknown; source: string; status: string; createdAt: Date; updatedAt: Date },
  profileId: string,
  peer: { id: string; displayName: string; avatarUrl: string | null } | null,
  lastMessage: string | null,
  lastMessageAt: Date,
  unreadCount: number
) {
  return {
    conversationId: conversation.id,
    status: conversation.status,
    source: conversation.source,
    peer,
    lastMessage,
    lastMessageAt: lastMessageAt.toISOString(),
    unreadCount,
  };
}

// GET /api/chat/peers?q= — search classmates + teachers of your classes
router.get("/peers", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const memberships = await prisma.classMember.findMany({
      where: { profileId },
      select: { classId: true },
    });
    const classIds = memberships.map((m) => m.classId);

    if (classIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const classes = await prisma.eduClass.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, teacherId: true },
    });
    const teacherIds = Array.from(new Set(classes.map((c) => c.teacherId)));

    const classmates = await prisma.classMember.findMany({
      where: { classId: { in: classIds }, profileId: { not: profileId } },
      include: {
        eduClass: { select: { name: true } },
        profile: {
          select: { id: true, displayName: true, avatarUrl: true, user: { select: { role: true } } },
        },
      },
    });

    const teachers = await prisma.profile.findMany({
      where: { id: { in: teacherIds.filter((t) => t !== profileId) } },
      select: { id: true, displayName: true, avatarUrl: true, user: { select: { role: true } } },
    });
    const teacherClassNames = new Map<string, string[]>();
    for (const c of classes) {
      if (!teacherClassNames.has(c.teacherId)) teacherClassNames.set(c.teacherId, []);
      teacherClassNames.get(c.teacherId)!.push(c.name);
    }

    const byId = new Map<string, { id: string; displayName: string; avatarUrl: string | null; role: string; classes: Set<string> }>();

    for (const m of classmates) {
      const p = m.profile;
      if (!byId.has(p.id)) {
        byId.set(p.id, { id: p.id, displayName: p.displayName, avatarUrl: p.avatarUrl, role: p.user.role, classes: new Set() });
      }
      byId.get(p.id)!.classes.add(m.eduClass.name);
    }
    for (const t of teachers) {
      if (!byId.has(t.id)) {
        byId.set(t.id, { id: t.id, displayName: t.displayName, avatarUrl: t.avatarUrl, role: t.user.role, classes: new Set() });
      }
      for (const name of teacherClassNames.get(t.id) ?? []) {
        byId.get(t.id)!.classes.add(name);
      }
    }

    const query = q.toLowerCase();
    const peers = Array.from(byId.values())
      .filter((p) => !query || p.displayName.toLowerCase().includes(query))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, 50)
      .map((p) => ({
        id: p.id,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        role: p.role,
        classes: Array.from(p.classes),
      }));

    return res.json({ success: true, data: peers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/chat/start — start (or reuse) a conversation with a classmate
router.post("/start", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;
    const { peerId } = req.body ?? {};

    if (!peerId || typeof peerId !== "string") {
      return res.status(400).json({ success: false, error: "peerId is required" });
    }
    if (peerId === profileId) {
      return res.status(400).json({ success: false, error: "You can't start a chat with yourself" });
    }

    const peer = await prisma.profile.findUnique({
      where: { id: peerId },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    if (!peer) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    if (!(await shareAClass(profileId, peerId))) {
      return res.status(403).json({ success: false, error: "You can only start chats with users in your class" });
    }

    const existing = await findPairConversation(profileId, peerId, "ACTIVE");
    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: { profileIds: [profileId, peerId], status: "ACTIVE", source: "MANUAL" },
      }));

    const last = await prisma.chatMessage.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { sentAt: "desc" },
    });
    const unreadCount = last
      ? await prisma.chatMessage.count({
          where: { conversationId: conversation.id, senderId: peerId, read: false },
        })
      : 0;

    return res.status(201).json({
      success: true,
      data: conversationSummary(
        conversation as any,
        profileId,
        { id: peer.id, displayName: peer.displayName, avatarUrl: peer.avatarUrl },
        last?.content ?? null,
        last?.sentAt ?? conversation.updatedAt,
        unreadCount
      ),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/chat/:conversationId/close — close a conversation (any participant)
router.post("/:conversationId/close", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const profileId = req.profileId!;
    const conversation = await findConversation(req.params.conversationId as string, profileId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    const updated =
      conversation.status === "CLOSED"
        ? conversation
        : await prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: "CLOSED", closedAt: new Date() },
          });

    const otherId = getOtherId(conversation.profileIds, profileId);
    if (otherId) {
      wsManager.sendToProfile(otherId, {
        type: "conversation_closed",
        payload: { conversationId: conversation.id },
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

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
        source: conversation.source,
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
      const sender = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { displayName: true },
      });
      wsManager.sendToProfile(otherId, {
        type: "new_message",
        payload: {
          id: message.id,
          conversationId,
          senderId: profileId,
          senderName: sender?.displayName ?? "Someone",
          content: message.content,
          sentAt: message.sentAt.toISOString(),
          read: false,
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
