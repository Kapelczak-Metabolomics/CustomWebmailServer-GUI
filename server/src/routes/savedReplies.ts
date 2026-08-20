import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

router.get("/", async (_req, res) => {
  const replies = await prisma.savedReply.findMany({
    orderBy: { updatedAt: "desc" as const },
  });
  res.json(replies);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const reply = await prisma.savedReply.findUnique({ where: { id } });
  if (!reply) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(reply);
});

router.post("/", async (req: AuthRequest, res) => {
  const { name, subject, body, mailboxId } = req.body;
  const reply = await prisma.savedReply.create({
    data: { name, subject, body, mailboxId },
  });
  res.status(201).json(reply);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const { name, subject, body, mailboxId } = req.body;
  const reply = await prisma.savedReply.update({
    where: { id },
    data: { name, subject, body, mailboxId },
  });
  res.json(reply);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.savedReply.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
