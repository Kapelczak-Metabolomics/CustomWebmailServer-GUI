import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SECRET_DIR = process.env.SECRET_DIR || "/app/data";

function ensureDir(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

function generatePassword(length = 16): string {
  return randomBytes(length).toString("base64url").slice(0, length);
}

async function getAdminPassword(): Promise<{
  password: string;
  generated: boolean;
}> {
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  if (envPassword) return { password: envPassword, generated: false };

  const passwordFile = path.join(SECRET_DIR, ".admin-password");
  try {
    if (fs.existsSync(passwordFile)) {
      const p = fs.readFileSync(passwordFile, "utf-8").trim();
      if (p) return { password: p, generated: false };
    }
  } catch {
    /* ignore */
  }

  const generated = generatePassword();
  try {
    ensureDir(SECRET_DIR);
    fs.writeFileSync(passwordFile, generated, { mode: 0o600 });
  } catch (err) {
    console.error("Failed to write admin password file:", err);
  }
  return { password: generated, generated: true };
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@example.com";
  const adminName = process.env.ADMIN_NAME?.trim() || "Admin User";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    if (envPassword) {
      const hash = await bcrypt.hash(envPassword, 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hash },
      });
      console.log(`Admin password updated for ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
  } else {
    const { password, generated } = await getAdminPassword();
    const hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        role: "admin",
        password: hash,
      },
    });

    if (generated) {
      console.log(`\n=== ADMIN USER CREATED ===`);
      console.log(`Email:    ${adminEmail}`);
      console.log(`Password: ${password}`);
      console.log(`==========================\n`);
      console.log(
        `Password also saved to ${path.join(SECRET_DIR, ".admin-password")}`,
      );
    } else {
      console.log(`Admin user created: ${adminEmail}`);
    }
  }

  await prisma.mailbox.upsert({
    where: { email: "support@example.com" },
    update: {},
    create: {
      name: "Support",
      email: "support@example.com",
      color: "#2563EB",
      imapHost: process.env.MAILPIT_HOST || "localhost",
      imapPort: parseInt(process.env.MAILPIT_IMAP_PORT || "143"),
      imapSecure: false,
      imapUser: "support@example.com",
      imapPassword: "anything",
      smtpHost: process.env.MAILPIT_HOST || "localhost",
      smtpPort: parseInt(process.env.MAILPIT_SMTP_PORT || "1025"),
      smtpSecure: false,
      smtpUser: "support@example.com",
      smtpPassword: "anything",
    },
  });

  // Create agent user for testing
  const agentEmail = "agent@example.com";
  const existingAgent = await prisma.user.findUnique({
    where: { email: agentEmail },
  });
  if (!existingAgent) {
    const agentHash = await bcrypt.hash("agent123", 10);
    await prisma.user.create({
      data: {
        email: agentEmail,
        name: "Agent One",
        role: "agent",
        password: agentHash,
      },
    });
    console.log(`Agent user created: ${agentEmail} (password: agent123)`);
  } else {
    console.log(`Agent user already exists: ${agentEmail}`);
  }

  await prisma.brandSettings.upsert({
    where: { id: (await prisma.brandSettings.findFirst())?.id ?? "" },
    update: {},
    create: { companyName: "IsotopIQ Mail", primaryColor: "#2563EB" },
  });

  await prisma.appSettings.upsert({
    where: { id: (await prisma.appSettings.findFirst())?.id ?? "" },
    update: {},
    create: {
      companyName: "IsotopIQ Mail",
      officeHours: "Mon-Fri 9am-5pm",
      autoReply: false,
      whiteLabel: false,
    },
  });

  const contactCount = await prisma.contact.count();
  if (contactCount === 0) {
    const contact = await prisma.contact.create({
      data: {
        name: "Jane Doe",
        email: "jane@acme.com",
        company: "Acme Inc",
        phone: "+15551234567",
      },
    });

    const mailbox = await prisma.mailbox.findUnique({
      where: { email: "support@example.com" },
    });
    if (mailbox) {
      await prisma.conversation.create({
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
    }
  }

  console.log("Seed complete.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
