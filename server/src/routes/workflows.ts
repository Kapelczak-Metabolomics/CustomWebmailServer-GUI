import { Router } from "express";
import {
  authenticate,
  requireRole,
  type AuthRequest,
} from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

router.get("/", async (_req, res) => {
  const workflows = await prisma.workflow.findMany({
    orderBy: { updatedAt: "desc" as const },
  });
  res.json(workflows);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(workflow);
});

router.post("/", requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, active, conditions, actions } = req.body;
  const workflow = await prisma.workflow.create({
    data: {
      name,
      active: active ?? true,
      conditions,
      actions,
    },
  });
  res.status(201).json(workflow);
});

router.patch("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const { name, active, conditions, actions } = req.body;
  const workflow = await prisma.workflow.update({
    where: { id },
    data: { name, active, conditions, actions },
  });
  res.json(workflow);
});

router.delete("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.workflow.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
