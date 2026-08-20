// @ts-nocheck
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "../lib/db.js";

export async function fetchMailbox(mailboxId: string) {
  const mailbox = await prisma.mailbox.findUnique({ where: { id: mailboxId } });
  if (
    !mailbox ||
    !mailbox.imapHost ||
    !mailbox.imapUser ||
    !mailbox.imapPassword
  )
    return;

  const client = new ImapFlow({
    host: mailbox.imapHost,
    port: mailbox.imapPort,
    secure: mailbox.imapSecure,
    auth: { user: mailbox.imapUser, pass: mailbox.imapPassword },
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since =
        mailbox.lastFetchAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const messages = await client.search({ since, unseen: true });
      for (const uid of messages) {
        const source = await client.download(`${uid}`);
        const parsed = await simpleParser(source.content);
        const from = parsed.from?.value[0];
        if (!from) continue;

        const contact = await prisma.contact.upsert({
          where: { email: from.address },
          create: { name: from.name || from.address, email: from.address },
          update: {},
        });

        const subject = parsed.subject || "(no subject)";
        const body = parsed.html || parsed.textAsHtml || parsed.text || "";

        // Check for thread by In-Reply-To / References
        const ref = parsed.references?.[0] || parsed.inReplyTo;
        let conv = ref
          ? await prisma.conversation.findFirst({
              where: { messages: { some: { messageId: ref } } },
            })
          : null;

        if (!conv) {
          const count = await prisma.conversation.count({
            where: { mailboxId: mailbox.id },
          });
          conv = await prisma.conversation.create({
            data: {
              number: count + 1001,
              subject,
              mailboxId: mailbox.id,
              contactId: contact.id,
              status: "open",
              source: "email",
              messages: {
                create: {
                  type: "customer",
                  body,
                  bodyText: parsed.text || "",
                  to: parsed.to?.value.map((a) => a.address) || [],
                  cc: parsed.cc?.value.map((a) => a.address) || [],
                  messageId: parsed.messageId,
                  authorType: "customer",
                },
              },
            },
          });
        } else {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              type: "customer",
              body,
              bodyText: parsed.text || "",
              to: parsed.to?.value.map((a) => a.address) || [],
              cc: parsed.cc?.value.map((a) => a.address) || [],
              messageId: parsed.messageId,
              authorType: "customer",
            },
          });
          await prisma.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() },
          });
        }
      }
      await client.messageFlagsAdd(messages, ["\\Seen"]);
    } finally {
      lock.release();
    }
    await client.logout();
    await prisma.mailbox.update({
      where: { id: mailbox.id },
      data: { lastFetchAt: new Date() },
    });
  } catch (err) {
    console.error("IMAP fetch failed:", err);
  }
}

export async function fetchAllMailboxes() {
  const mailboxes = await prisma.mailbox.findMany();
  for (const mb of mailboxes) {
    await fetchMailbox(mb.id).catch(console.error);
  }
}
