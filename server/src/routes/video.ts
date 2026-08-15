import { Router } from "express";
import crypto from "crypto";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";
import { config } from "../lib/config.js";

const router: Router = Router();

router.use(authenticate);

router.get("/turn", (req: AuthRequest, res) => {
  if (!config.turn.secret) {
    res.status(503).json({ error: "TURN not configured" });
    return;
  }
  const username = `${Math.floor(Date.now() / 1000) + config.turn.ttl}:${req.user!.id}`;
  const credential = crypto
    .createHmac("sha1", config.turn.secret)
    .update(username)
    .digest("base64");
  res.json({
    urls: [
      `turn:${config.turn.realm}:3478?transport=udp`,
      `turn:${config.turn.realm}:3478?transport=tcp`,
      `stun:${config.turn.realm}:3478`,
    ],
    username,
    credential,
  });
});

router.get("/rooms", async (req: AuthRequest, res) => {
  const rooms = await prisma.videoRoom.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  res.json(rooms);
});

router.post("/rooms", async (req: AuthRequest, res) => {
  const { name } = req.body;
  const room = await prisma.videoRoom.create({
    data: {
      name: name || `Meeting ${new Date().toISOString()}`,
      createdBy: req.user!.id,
    },
  });
  res.status(201).json(room);
});

router.get("/rooms/:id", async (req, res) => {
  const id = req.params.id as string;
  const room = await prisma.videoRoom.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(room);
});

router.post("/rooms/:id/join", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const member = await prisma.videoRoomMember.upsert({
    where: { roomId_userId: { roomId: id, userId: req.user!.id } },
    create: { roomId: id, userId: req.user!.id },
    update: {},
  });
  res.json(member);
});

export default router;
