import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

router.get("/rooms", async (req: AuthRequest, res) => {
  const rooms = await prisma.chatRoom.findMany({
    where: { members: { some: { userId: req.user!.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      messages: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        include: {
          receipts: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  res.json(rooms);
});

router.post("/rooms", async (req: AuthRequest, res) => {
  const { name, userIds, direct, contextType, contextId } = req.body;
  const isDirect = direct ?? (userIds?.length === 1);

  // For direct messages, check if one already exists between these two users
  if (isDirect && userIds?.length === 1) {
    const existing = await prisma.chatRoom.findFirst({
      where: {
        direct: true,
        members: {
          every: {
            userId: { in: [req.user!.id, userIds[0]] },
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    // Verify it has exactly these 2 members
    if (existing && existing.members.length === 2) {
      const memberIds = existing.members.map((m) => m.userId);
      if (
        memberIds.includes(req.user!.id) &&
        memberIds.includes(userIds[0])
      ) {
        res.json(existing);
        return;
      }
    }
  }

  const room = await prisma.chatRoom.create({
    data: {
      name: name || null,
      direct: isDirect,
      contextType,
      contextId,
      members: {
        create: [req.user!.id, ...userIds].map((id) => ({ userId: id })),
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  res.status(201).json(room);
});

router.get("/rooms/:id/messages", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const messages = await prisma.chatMessage.findMany({
    where: { roomId: id },
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { id: true, name: true } },
      receipts: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  res.json(messages);
});

// Toggle read receipts for current user
router.patch("/read-receipts", async (req: AuthRequest, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "enabled must be boolean" });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { readReceiptsEnabled: enabled },
    select: { id: true, readReceiptsEnabled: true },
  });
  res.json(user);
});

// Get current user's read receipts setting
router.get("/read-receipts", async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { readReceiptsEnabled: true },
  });
  const appSettings = await prisma.appSettings.findFirst({
    select: { forceReadReceipts: true },
  });
  res.json({
    readReceiptsEnabled: user?.readReceiptsEnabled ?? true,
    forceReadReceipts: appSettings?.forceReadReceipts ?? false,
  });
});

export default router;
