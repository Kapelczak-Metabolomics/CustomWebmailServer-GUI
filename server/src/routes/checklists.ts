import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

// List checklists for a conversation
router.get("/conversations/:conversationId/checklists", async (req, res) => {
  const checklists = await prisma.checklist.findMany({
    where: { conversationId: req.params.conversationId as string },
    include: { items: true },
    orderBy: { createdAt: "asc" as const },
  });
  res.json(checklists);
});

// Create a checklist for a conversation
router.post("/conversations/:conversationId/checklists", async (req: AuthRequest, res) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  const checklist = await prisma.checklist.create({
    data: {
      conversationId: req.params.conversationId as string,
      title,
    },
    include: { items: true },
  });
  res.status(201).json(checklist);
});

// Update a checklist
router.patch("/:id", async (req: AuthRequest, res) => {
  const { title } = req.body;
  const checklist = await prisma.checklist.update({
    where: { id: req.params.id as string },
    data: { title },
    include: { items: true },
  });
  res.json(checklist);
});

// Delete a checklist
router.delete("/:id", async (req: AuthRequest, res) => {
  await prisma.checklist.delete({ where: { id: req.params.id as string } });
  res.json({ ok: true });
});

// Add an item to a checklist
router.post("/:id/items", async (req: AuthRequest, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: "Text is required" });
    return;
  }
  const item = await prisma.checklistItem.create({
    data: { checklistId: req.params.id as string, text },
  });
  res.status(201).json(item);
});

// Update a checklist item
router.patch("/:id/items/:itemId", async (req: AuthRequest, res) => {
  const { text, done } = req.body;
  const item = await prisma.checklistItem.update({
    where: { id: req.params.itemId as string },
    data: {
      ...(text !== undefined ? { text } : {}),
      ...(done !== undefined ? { done } : {}),
    },
  });
  res.json(item);
});

// Delete a checklist item
router.delete("/:id/items/:itemId", async (req: AuthRequest, res) => {
  await prisma.checklistItem.delete({ where: { id: req.params.itemId as string } });
  res.json({ ok: true });
});

export default router;
