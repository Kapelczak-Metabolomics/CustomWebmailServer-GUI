import { Router } from "express";
import crypto from "crypto";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";
import { config } from "../lib/config.js";

const router: Router = Router();

// Public: get TURN credentials (works for both auth and guest)
// We use a optional auth here — if token present, use user id; else use guest id
router.get("/turn", async (req, res) => {
  if (!config.turn.secret) {
    res.status(503).json({ error: "TURN not configured" });
    return;
  }
  const ident = (req as AuthRequest).user?.id || req.headers["x-guest-id"] as string || "guest";
  const username = `${Math.floor(Date.now() / 1000) + config.turn.ttl}:${ident}`;
  const credential = crypto
    .createHmac("sha1", config.turn.secret)
    .update(username)
    .digest("base64");
  const turnPort = process.env.TURN_PORT || "3478";
  const turnHost = config.turn.host || "localhost";
  res.json({
    urls: [
      `stun:${turnHost}:${turnPort}`,
      `turn:${turnHost}:${turnPort}?transport=udp`,
      `turn:${turnHost}:${turnPort}?transport=tcp`,
    ],
    username,
    credential,
  });
});

// Public: get room info (for guest access)
router.get("/rooms/:id/info", async (req, res) => {
  const id = req.params.id as string;
  const room = await prisma.videoRoom.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      allowGuests: true,
      active: true,
      recordingActive: true,
      _count: { select: { members: true } },
    },
  });
  if (!room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(room);
});

// Public: guest join a room
router.post("/rooms/:id/guest-join", async (req, res) => {
  const id = req.params.id as string;
  const { guestName } = req.body;
  const room = await prisma.videoRoom.findUnique({ where: { id } });
  if (!room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!room.allowGuests) {
    res.status(403).json({ error: "Guest access disabled" });
    return;
  }
  const guestId = `guest-${crypto.randomUUID()}`;
  // Create a member entry with null userId and guestName
  await prisma.videoRoomMember.create({
    data: {
      roomId: id,
      userId: guestId,
      guestName: guestName || "Guest",
    },
  }).catch(() => {
    // If unique constraint fails (already a member), update
  });
  res.json({ guestId, roomId: id, guestName: guestName || "Guest" });
});

// Public: guest leave
router.post("/rooms/:id/guest-leave", async (req, res) => {
  const id = req.params.id as string;
  const { guestId } = req.body;
  await prisma.videoRoomMember.updateMany({
    where: { roomId: id, userId: guestId, leftAt: null },
    data: { leftAt: new Date() },
  }).catch(() => {});
  res.json({ ok: true });
});

// Public: list messages for a room (guest can read)
router.get("/rooms/:id/messages", async (req, res) => {
  const id = req.params.id as string;
  const messages = await prisma.videoRoomMessage.findMany({
    where: { roomId: id },
    orderBy: { createdAt: "asc" as const },
  });
  res.json(messages);
});

// All routes below require authentication
router.use(authenticate);

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
  const { name, allowGuests } = req.body;
  const room = await prisma.videoRoom.create({
    data: {
      name: name || `Meeting ${new Date().toISOString()}`,
      createdBy: req.user!.id,
      allowGuests: allowGuests ?? true,
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
      messages: { orderBy: { createdAt: "asc" as const } },
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
    update: { leftAt: null },
  });
  res.json(member);
});

// Leave a meeting
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
  const io = req.app.get("io") as any;
  if (io) io.to(id).emit("user-left", { userId: req.user!.id });
  res.json({ ok: true });
});

// Update room (creator or admin)
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
  const { name, active, allowGuests } = req.body;
  const updated = await prisma.videoRoom.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(allowGuests !== undefined ? { allowGuests } : {}),
    },
  });
  res.json(updated);
});

// Toggle recording
router.post("/rooms/:id/recording", async (req: AuthRequest, res) => {
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
  const { active, url } = req.body;
  const updated = await prisma.videoRoom.update({
    where: { id },
    data: {
      recordingActive: active ?? !room.recordingActive,
      ...(url !== undefined ? { recordingUrl: url } : {}),
    },
  });
  // Notify participants
  const io = req.app.get("io") as any;
  if (io) io.to(id).emit("recording-status", { active: updated.recordingActive });
  res.json(updated);
});

// Hard delete
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
  const io = req.app.get("io") as any;
  if (io) io.to(id).emit("room-deleted", { roomId: id });
  await prisma.videoRoom.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
