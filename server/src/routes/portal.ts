import { Router } from "express";
import { prisma } from "../lib/db.js";
import { sendMail } from "../services/mailer.js";

const router: Router = Router();

// Public: list published articles
router.get("/articles", async (_req, res) => {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" as const },
  });
  res.json(articles);
});

// Public: submit a new ticket
router.post("/tickets", async (req, res) => {
  const { mailboxId, name, email, subject, body } = req.body;
  if (!email || !subject || !body) {
    res.status(400).json({ error: "Email, subject and body are required" });
    return;
  }

  let mailbox = mailboxId
    ? await prisma.mailbox.findUnique({ where: { id: mailboxId } })
    : await prisma.mailbox.findFirst();
  if (!mailbox) {
    res.status(400).json({ error: "No mailbox available" });
    return;
  }

  const contact = await prisma.contact.upsert({
    where: { email },
    create: { name: name || email, email },
    update: { name: name || undefined },
  });

  const count = await prisma.conversation.count({
    where: { mailboxId: mailbox.id },
  });

  const conv = await prisma.conversation.create({
    data: {
      number: count + 1001,
      subject,
      mailboxId: mailbox.id,
      contactId: contact.id,
      status: "open",
      source: "portal",
      messages: {
        create: {
          type: "customer",
          body,
          bodyText: body.replace(/<[^>]+>/g, ""),
          authorType: "customer",
        },
      },
    },
  });

  // Send auto-reply if SMTP configured
  if (mailbox.smtpHost || process.env.SMTP_HOST) {
    await sendMail({
      mailbox,
      from: mailbox.email,
      to: [contact.email],
      subject: `Re: ${subject}`,
      html: `<p>Thank you for contacting us. Your ticket #${conv.number} has been received and our team will respond shortly.</p>`,
    }).catch((err: Error) =>
      console.error("Portal auto-reply failed:", err.message),
    );
  }

  res.status(201).json({ number: conv.number, id: conv.id });
});

// Public: view a ticket by number + email
router.get("/tickets/:number", async (req, res) => {
  const number = parseInt(req.params.number);
  const email = (req.query.email as string || "").trim().toLowerCase();
  if (!number || !email) {
    res.status(400).json({ error: "Ticket number and email are required" });
    return;
  }

  const conv = await prisma.conversation.findFirst({
    where: { number },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" as const },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!conv || conv.contact.email.toLowerCase() !== email) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json({
    number: conv.number,
    subject: conv.subject,
    status: conv.status,
    priority: conv.priority,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messages: conv.messages.map((m) => ({
      id: m.id,
      type: m.type,
      body: m.body,
      bodyText: m.bodyText,
      authorName: m.author?.name || (m.authorType === "customer" ? conv.contact.name : "Agent"),
      createdAt: m.createdAt,
    })),
  });
});

// Public: submit satisfaction rating for a ticket
router.post("/tickets/:number/rating", async (req, res) => {
  const number = parseInt(req.params.number);
  const email = (req.query.email as string || "").trim().toLowerCase();
  const { rating, comment } = req.body;

  if (!number || !email) {
    res.status(400).json({ error: "Ticket number and email are required" });
    return;
  }
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const conv = await prisma.conversation.findFirst({
    where: { number },
    include: { contact: true },
  });

  if (!conv || conv.contact.email.toLowerCase() !== email) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const existing = await prisma.satisfactionRating.findFirst({
    where: { conversationId: conv.id },
  });

  let result;
  if (existing) {
    result = await prisma.satisfactionRating.update({
      where: { id: existing.id },
      data: { rating: parseInt(rating), comment },
    });
  } else {
    result = await prisma.satisfactionRating.create({
      data: {
        conversationId: conv.id,
        rating: parseInt(rating),
        comment,
      },
    });
  }

  res.status(201).json(result);
});

// Public: get satisfaction rating for a ticket
router.get("/tickets/:number/rating", async (req, res) => {
  const number = parseInt(req.params.number);
  const email = (req.query.email as string || "").trim().toLowerCase();

  if (!number || !email) {
    res.status(400).json({ error: "Ticket number and email are required" });
    return;
  }

  const conv = await prisma.conversation.findFirst({
    where: { number },
    include: { contact: true },
  });

  if (!conv || conv.contact.email.toLowerCase() !== email) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const rating = await prisma.satisfactionRating.findFirst({
    where: { conversationId: conv.id },
  });

  res.json(rating);
});

export default router;
