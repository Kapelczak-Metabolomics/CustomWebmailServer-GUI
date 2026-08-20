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
  const mailboxes = await prisma.mailbox.findMany({
    orderBy: { name: "asc" as const },
    select: {
      id: true,
      name: true,
      email: true,
      color: true,
      imapHost: true,
      imapPort: true,
      imapSecure: true,
      imapUser: true,
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      lastFetchAt: true,
      createdAt: true,
    },
  });
  res.json(mailboxes);
});

router.post("/", requireRole("admin"), async (req: AuthRequest, res) => {
  const {
    name,
    email,
    color,
    imapHost,
    imapPort,
    imapSecure,
    imapUser,
    imapPassword,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPassword,
  } = req.body;
  const mailbox = await prisma.mailbox.create({
    data: {
      name,
      email,
      color,
      imapHost,
      imapPort,
      imapSecure,
      imapUser,
      imapPassword,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
    },
  });
  res.status(201).json(mailbox);
});

router.patch("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const mailbox = await prisma.mailbox.update({
    where: { id },
    data: req.body,
  });
  res.json(mailbox);
});

router.delete("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.mailbox.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
