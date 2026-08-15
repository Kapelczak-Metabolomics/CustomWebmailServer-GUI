import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";
import { sendMail } from "../services/mailer.js";

const router: Router = Router();

router.use(authenticate);

router.post("/", async (req: AuthRequest, res) => {
  const conversationId = req.body.conversationId as string;
  const { type, body, to, cc, bcc } = req.body;
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { mailbox: true, contact: true },
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      type: type || "reply",
      body,
      bodyText: body,
      to: (to || []) as string[],
      cc: (cc || []) as string[],
      bcc: (bcc || []) as string[],
      authorId: req.user!.id,
      authorType: req.user!.role === "customer" ? "customer" : "agent",
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      attachments: true,
    },
  });

  // Update conversation timestamp and status
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      status: type === "reply" && conv.status !== "closed" ? "open" : undefined,
    },
  });

  // Send email for outbound replies
  if (type === "reply" && conv.contact && conv.mailbox) {
    await sendMail({
      from: conv.mailbox.email,
      to: [conv.contact.email],
      cc: cc as string[] | undefined,
      bcc: bcc as string[] | undefined,
      subject: `Re: ${conv.subject}`,
      html: body,
    }).catch((err: Error) =>
      console.error("Failed to send mail:", err.message),
    );
  }

  res.status(201).json(message);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      attachments: true,
    },
  });
  if (!message) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(message);
});

export default router;
