import { Router } from "express";
import {
  authenticate,
  requireRole,
  type AuthRequest,
} from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

// List all custom field definitions
router.get("/", async (_req, res) => {
  const fields = await prisma.customField.findMany({
    orderBy: { name: "asc" as const },
    include: { values: true },
  });
  res.json(fields);
});

// Create a custom field (admin only)
router.post("/", requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, type, options, target } = req.body;
  if (!name || !type) {
    res.status(400).json({ error: "Name and type are required" });
    return;
  }
  const field = await prisma.customField.create({
    data: {
      name,
      type,
      options: options || null,
      target: target || "contact",
    },
  });
  res.status(201).json(field);
});

// Update a custom field (admin only)
router.patch("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, type, options, target } = req.body;
  const field = await prisma.customField.update({
    where: { id: req.params.id as string },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(options !== undefined ? { options } : {}),
      ...(target !== undefined ? { target } : {}),
    },
  });
  res.json(field);
});

// Delete a custom field (admin only)
router.delete("/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  await prisma.customField.delete({ where: { id: req.params.id as string } });
  res.json({ ok: true });
});

// Get custom field values for a contact
router.get("/contacts/:contactId/fields", async (req, res) => {
  const values = await prisma.customFieldValue.findMany({
    where: { contactId: req.params.contactId as string },
    include: { customField: true },
  });
  res.json(values);
});

// Set a custom field value for a contact
router.patch("/contacts/:contactId/fields", async (req: AuthRequest, res) => {
  const { fieldId, value } = req.body;
  if (!fieldId) {
    res.status(400).json({ error: "fieldId is required" });
    return;
  }
  const fieldValue = await prisma.customFieldValue.upsert({
    where: {
      customFieldId_contactId: {
        customFieldId: fieldId,
        contactId: req.params.contactId as string,
      },
    },
    create: {
      customFieldId: fieldId,
      contactId: req.params.contactId as string,
      value: value || "",
    },
    update: { value: value || "" },
    include: { customField: true },
  });
  res.json(fieldValue);
});

export default router;
