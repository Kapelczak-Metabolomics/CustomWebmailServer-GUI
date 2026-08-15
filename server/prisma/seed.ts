import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
      password,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      email: "agent@example.com",
      name: "Support Agent",
      role: "agent",
      password,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Acme Customer",
      role: "customer",
      password,
    },
  });

  const mailbox = await prisma.mailbox.upsert({
    where: { email: "support@example.com" },
    update: {},
    create: {
      name: "Support",
      email: "support@example.com",
      color: "#2563EB",
      imapHost: "",
      imapPort: 993,
      imapSecure: true,
      imapUser: "",
      imapPassword: "",
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
    },
  });

  const brand = await prisma.brandSettings.upsert({
    where: { id: (await prisma.brandSettings.findFirst())?.id ?? "" },
    update: {},
    create: { companyName: "IsotopIQ Mail", primaryColor: "#2563EB" },
  });

  const contact = await prisma.contact.upsert({
    where: { email: "jane@acme.com" },
    update: {},
    create: {
      name: "Jane Doe",
      email: "jane@acme.com",
      company: "Acme Inc",
      phone: "+15551234567",
    },
  });

  const conv = await prisma.conversation.create({
    data: {
      number: 1001,
      subject: "Welcome to your new helpdesk",
      mailboxId: mailbox.id,
      contactId: contact.id,
      status: "open",
      priority: "medium",
      source: "manual",
      messages: {
        create: {
          type: "customer",
          body: "<p>Hi, I'm excited to start using the helpdesk!</p>",
          bodyText: "Hi, I'm excited to start using the helpdesk!",
          to: ["support@example.com"],
          authorType: "customer",
        },
      },
    },
  });

  console.log({ admin, agent, customer, mailbox, brand, contact, conv });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
