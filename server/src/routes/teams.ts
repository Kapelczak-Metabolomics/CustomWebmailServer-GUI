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
  const teams = await prisma.team.findMany({
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
    orderBy: { name: "asc" as const },
  });
  res.json(teams);
});

router.get("/:id", async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id as string },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  if (!team) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(team);
});

router.post("/", requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, description, memberIds } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const team = await prisma.team.create({
    data: {
      name,
      description,
      members: memberIds?.length
        ? { create: memberIds.map((userId: string) => ({ userId })) }
        : undefined,
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  res.status(201).json(team);
});

router.patch("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  const team = await prisma.team.update({
    where: { id: req.params.id as string },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  res.json(team);
});

router.delete("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  await prisma.team.delete({ where: { id: req.params.id as string } });
  res.json({ ok: true });
});

router.post("/:id/members", requireRole("admin"), async (req: AuthRequest, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }
  const member = await prisma.userTeam.upsert({
    where: { userId_teamId: { userId, teamId: req.params.id as string } },
    create: { userId, teamId: req.params.id as string },
    update: {},
  });
  res.status(201).json(member);
});

router.delete("/:id/members/:userId", requireRole("admin"), async (req: AuthRequest, res) => {
  await prisma.userTeam.deleteMany({
    where: { teamId: req.params.id as string, userId: req.params.userId as string },
  });
  res.json({ ok: true });
});

export default router;
