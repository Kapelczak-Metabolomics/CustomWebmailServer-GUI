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
      messages: { orderBy: { createdAt: "desc" as const }, take: 1 },
    },
  });
  res.json(rooms);
});

router.post("/rooms", async (req: AuthRequest, res) => {
  const { name, userIds, direct, contextType, contextId } = req.body;
  const room = await prisma.chatRoom.create({
    data: {
      name,
      direct: direct ?? userIds.length === 2,
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
    include: { user: { select: { id: true, name: true } } },
  });
  res.json(messages);
});

export default router;
