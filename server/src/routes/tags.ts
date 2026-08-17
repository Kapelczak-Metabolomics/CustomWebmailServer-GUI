import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

router.get("/", async (_req, res) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" as const } });
  res.json(tags);
});

router.post("/", async (req: AuthRequest, res) => {
  const { name, color } = req.body;
  const tag = await prisma.tag.create({
    data: { name, color: color || "#6B7280" },
  });
  res.status(201).json(tag);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.tag.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
