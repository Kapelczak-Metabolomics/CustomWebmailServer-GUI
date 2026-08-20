import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

router.get("/", async (_req, res) => {
  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" as const },
  });
  res.json(articles);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id as string;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(article);
});

router.get("/slug/:slug", async (req, res) => {
  const slug = req.params.slug as string;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(article);
});

router.post("/", async (req: AuthRequest, res) => {
  const { title, body, category, published } = req.body;
  const slug = String(title)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const existing = await prisma.article.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;
  const article = await prisma.article.create({
    data: {
      title,
      slug: finalSlug,
      body,
      category: category || "General",
      published: published ?? true,
    },
  });
  res.status(201).json(article);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const { title, body, category, published } = req.body;
  const data: any = { body, category, published };
  if (title) {
    data.title = title;
    let slug = String(title)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const existing = await prisma.article.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) slug = `${slug}-${Date.now()}`;
    data.slug = slug;
  }
  const article = await prisma.article.update({ where: { id }, data });
  res.json(article);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await prisma.article.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
