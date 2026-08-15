import { Router } from "express";
import { Prisma } from "@prisma/client";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

const includeFull: Prisma.ConversationInclude = {
  mailbox: true,
  contact: true,
  assignee: { select: { id: true, name: true, email: true } },
  labels: { include: { label: true } },
  tags: { include: { tag: true } },
  messages: {
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      attachments: true,
    },
  },
  checklists: { include: { items: true } },
  followers: { include: { user: { select: { id: true, name: true } } } },
  timeEntries: true,
  ratings: true,
};

router.get("/", async (req: AuthRequest, res) => {
  const {
    status,
    folder,
    mailbox,
    assignee,
    search,
    label,
    tag,
    page = "1",
    limit = "50",
  } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (folder) where.folder = folder;
  if (mailbox) where.mailboxId = mailbox;
  if (assignee) where.assigneeId = assignee;
  if (label)
    where.labels = {
      some: {
        label: { name: { equals: label as string, mode: "insensitive" } },
      },
    };
  if (tag)
    where.tags = {
      some: { tag: { name: { equals: tag as string, mode: "insensitive" } } },
    };
  if (search) {
    where.OR = [
      { subject: { contains: search as string, mode: "insensitive" } },
      {
        contact: {
          OR: [
            { name: { contains: search as string, mode: "insensitive" } },
            { email: { contains: search as string, mode: "insensitive" } },
          ],
        },
      },
      {
        messages: {
          some: {
            bodyText: { contains: search as string, mode: "insensitive" },
          },
        },
      },
    ];
  }

  const [items, count] = await Promise.all([
    prisma.conversation.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { updatedAt: "desc" },
      include: {
        mailbox: true,
        contact: true,
        assignee: { select: { id: true, name: true } },
        labels: { include: { label: true } },
        tags: { include: { tag: true } },
        messages: { orderBy: { createdAt: "desc" as const }, take: 1 },
      },
    }),
    prisma.conversation.count({ where }),
  ]);
  res.json({ items, count });
});

router.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: includeFull,
  });
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(conv);
});

router.post("/", async (req: AuthRequest, res) => {
  const { subject, mailboxId, contactId, status, priority, source, body, to } =
    req.body;
  const count = await prisma.conversation.count({ where: { mailboxId } });
  const conv = await prisma.conversation.create({
    data: {
      number: count + 1001,
      subject,
      mailboxId,
      contactId,
      status: status || "open",
      priority: priority || "medium",
      source: source || "manual",
      messages: body
        ? {
            create: {
              type: "customer",
              body,
              bodyText: body,
              to: to || [],
              authorType: "customer",
            },
          }
        : undefined,
    },
    include: includeFull,
  });
  res.status(201).json(conv);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const { status, priority, folder, assigneeId, snoozeUntil, readBy } =
    req.body;
  const conv = await prisma.conversation.update({
    where: { id },
    data: {
      status,
      priority,
      folder,
      assigneeId,
      snoozeUntil: snoozeUntil ? new Date(snoozeUntil) : undefined,
      readBy: readBy ? { set: readBy } : undefined,
    },
    include: includeFull,
  });
  res.json(conv);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.conversation.delete({ where: { id } });
  res.json({ ok: true });
});

// Actions
router.post("/:id/follow", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.conversationFollower.upsert({
    where: {
      conversationId_userId: { conversationId: id, userId: req.user!.id },
    },
    create: { conversationId: id, userId: req.user!.id },
    update: {},
  });
  res.json({ ok: true });
});

router.post("/:id/unfollow", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.conversationFollower.delete({
    where: {
      conversationId_userId: { conversationId: id, userId: req.user!.id },
    },
  });
  res.json({ ok: true });
});

router.post("/:id/star", async (req, res) => {
  const id = req.params.id as string;
  const conv = await prisma.conversation.update({
    where: { id },
    data: { folder: "starred" },
  });
  res.json(conv);
});

router.post("/:id/snooze", async (req, res) => {
  const id = req.params.id as string;
  const { until } = req.body;
  const conv = await prisma.conversation.update({
    where: { id },
    data: { snoozeUntil: new Date(until) },
  });
  res.json(conv);
});

export default router;
