import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

const contactInclude = {
  customFieldValues: { include: { customField: true } },
  notes: { orderBy: { createdAt: "desc" as const } },
};

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || "";
  const contacts = await prisma.contact.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" as const },
    include: contactInclude,
  });
  res.json(contacts);
});

router.get("/:id", async (req, res) => {
  const contact = await prisma.contact.findUnique({
    where: { id: req.params.id },
    include: {
      ...contactInclude,
      conversations: true,
    },
  });
  if (!contact) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(contact);
});

router.post("/", async (req: AuthRequest, res) => {
  const { name, email, company, phone } = req.body;
  const contact = await prisma.contact.create({
    data: { name, email, company, phone },
  });
  res.status(201).json(contact);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const { name, email, company, phone } = req.body;
  const contact = await prisma.contact.update({
    where: { id },
    data: { name, email, company, phone },
    include: contactInclude,
  });
  res.json(contact);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.contact.delete({ where: { id } });
  res.json({ ok: true });
});

// Contact notes
router.get("/:id/notes", async (req, res) => {
  const notes = await prisma.contactNote.findMany({
    where: { contactId: req.params.id },
    orderBy: { createdAt: "desc" as const },
  });
  res.json(notes);
});

router.post("/:id/notes", async (req: AuthRequest, res) => {
  const contactId = req.params.id as string;
  const { body, authorId } = req.body;
  const note = await prisma.contactNote.create({
    data: { contactId, authorId, body },
  });
  res.status(201).json(note);
});

router.delete("/:id/notes/:noteId", async (req: AuthRequest, res) => {
  const noteId = req.params.noteId as string;
  await prisma.contactNote.delete({ where: { id: noteId } });
  res.json({ ok: true });
});

export default router;
