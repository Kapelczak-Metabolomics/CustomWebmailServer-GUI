import { Router } from "express";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

// List time entries for a conversation
router.get("/conversations/:conversationId/time", async (req, res) => {
  const entries = await prisma.timeEntry.findMany({
    where: { conversationId: req.params.conversationId as string },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" as const },
  });
  res.json(entries);
});

// Create a time entry
router.post("/conversations/:conversationId/time", async (req: AuthRequest, res) => {
  const { minutes, description, messageId } = req.body;
  if (!minutes || minutes < 1) {
    res.status(400).json({ error: "Minutes must be at least 1" });
    return;
  }
  const entry = await prisma.timeEntry.create({
    data: {
      conversationId: req.params.conversationId as string,
      userId: req.user!.id,
      minutes: parseInt(minutes),
      messageId: messageId || undefined,
    },
    include: { user: { select: { id: true, name: true } } },
  });
  res.status(201).json(entry);
});

// Update a time entry
router.patch("/:id", async (req: AuthRequest, res) => {
  const entry = await prisma.timeEntry.findUnique({ where: { id: req.params.id as string } });
  if (!entry) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (entry.userId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const { minutes } = req.body;
  const updated = await prisma.timeEntry.update({
    where: { id: req.params.id as string },
    data: { ...(minutes !== undefined ? { minutes: parseInt(minutes) } : {}) },
    include: { user: { select: { id: true, name: true } } },
  });
  res.json(updated);
});

// Delete a time entry
router.delete("/:id", async (req: AuthRequest, res) => {
  const entry = await prisma.timeEntry.findUnique({ where: { id: req.params.id as string } });
  if (!entry) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (entry.userId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  await prisma.timeEntry.delete({ where: { id: req.params.id as string } });
  res.json({ ok: true });
});

// List all time entries (admin only, for reports)
router.get("/", requireRole("admin"), async (_req, res) => {
  const entries = await prisma.timeEntry.findMany({
    include: {
      user: { select: { id: true, name: true } },
      conversation: { select: { id: true, subject: true, number: true } },
    },
    orderBy: { createdAt: "desc" as const },
  });
  res.json(entries);
});

export default router;
