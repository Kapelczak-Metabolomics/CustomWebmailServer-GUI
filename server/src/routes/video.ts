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
  const turnPort = process.env.TURN_PORT || "3478";
  res.json({
    urls: [
      `turn:${config.turn.realm}:${turnPort}?transport=udp`,
      `turn:${config.turn.realm}:${turnPort}?transport=tcp`,
      `stun:${config.turn.realm}:${turnPort}`,
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

// Leave a meeting (set leftAt, preserves history)
router.post("/rooms/:id/leave", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const room = await prisma.videoRoom.findUnique({ where: { id } });
  if (!room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.videoRoomMember.updateMany({
    where: { roomId: id, userId: req.user!.id, leftAt: null },
    data: { leftAt: new Date() },
  });
  // Notify other participants via socket
  const io = req.app.get("io") as any;
  if (io) io.to(id).emit("user-left", { userId: req.user!.id });
  res.json({ ok: true });
});

// Update room name/active (creator or admin)
router.patch("/rooms/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const room = await prisma.videoRoom.findUnique({ where: { id } });
  if (!room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (room.createdBy !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const { name, active } = req.body;
  const updated = await prisma.videoRoom.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });
  res.json(updated);
});

// Hard delete a meeting (creator or admin only)
router.delete("/rooms/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const room = await prisma.videoRoom.findUnique({ where: { id } });
  if (!room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (room.createdBy !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  // Notify all participants that the room is being deleted
  const io = req.app.get("io") as any;
  if (io) {
    io.to(id).emit("room-deleted", { roomId: id });
  }
  // Hard delete — cascade removes members
  await prisma.videoRoom.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
