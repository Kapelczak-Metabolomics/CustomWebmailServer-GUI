import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import { config } from "../lib/config.js";
import { prisma } from "../lib/db.js";
import { sendMail } from "../services/mailer.js";
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

// Forgot password — always returns 200 to avoid leaking which emails exist
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    });
    // Try to send the reset email
    const resetUrl = `${config.clientUrl[0]}/reset-password?token=${resetToken}`;
    try {
      await sendMail({
        from: config.email.defaultFrom || "noreply@example.com",
        to: [user.email],
        subject: "Password Reset",
        html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p><p>If you didn't request this, ignore this email.</p>`,
        text: `Reset your password: ${resetUrl}`,
      });
    } catch (err: any) {
      console.error("Failed to send reset email:", err.message);
    }
  }
  res.json({ ok: true });
});

// Reset password with token
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    res.status(400).json({ error: "Token and password (min 6 chars) are required" });
    return;
  }
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetExpires: { gt: new Date() } },
  });
  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, resetToken: null, resetExpires: null },
  });
  res.json({ ok: true });
});

export default router;
