import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { config } from "../lib/config.js";
import { prisma } from "../lib/db.js";
import {
  authenticate,
  requireRole,
  type AuthRequest,
} from "../middleware/auth.js";

const router: Router = Router();

router.post(
  "/register",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("name").trim().notEmpty(),
  body("role").isIn(["admin", "agent", "customer"]),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, name, role },
      select: { id: true, email: true, name: true, role: true },
    });
    res.status(201).json(user);
  },
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = jwt.sign({ id: user.id }, config.jwtSecret as string, {
      expiresIn: config.jwtExpiry as any,
    });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  },
);

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      timezone: true,
      status: true,
    },
  });
  res.json(user);
});

router.patch(
  "/me",
  authenticate,
  body("email").optional().isEmail(),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { name, email, avatar, timezone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, email, avatar, timezone },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        timezone: true,
        status: true,
      },
    });
    res.json(user);
  },
);

router.post(
  "/change-password",
  authenticate,
  body("newPassword").isLength({ min: 6 }),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user || !user.password) {
      res.status(400).json({ error: "Password change not available" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });
    res.json({ ok: true });
  },
);

export default router;
