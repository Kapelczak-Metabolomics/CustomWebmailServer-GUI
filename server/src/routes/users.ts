import { Router } from "express";
import bcrypt from "bcrypt";
import {
  authenticate,
  requireRole,
  type AuthRequest,
} from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

router.get("/", requireRole("admin", "agent"), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      status: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: { name: "asc" as const },
  });
  res.json(users);
});

router.post("/", requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, email, role, timezone, status, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }
  const hash = password ? await bcrypt.hash(password, 10) : null;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      password: hash,
      timezone: timezone || "UTC",
      status: status || "active",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      status: true,
      avatar: true,
      createdAt: true,
    },
  });
  res.status(201).json(user);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      status: true,
      avatar: true,
      createdAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(user);
});

router.patch("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const { name, role, timezone, status } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: { name, role, timezone, status },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      status: true,
      avatar: true,
    },
  });
  res.json(user);
});

router.delete("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
