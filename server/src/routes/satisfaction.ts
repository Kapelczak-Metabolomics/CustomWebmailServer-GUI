import { Router } from "express";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

// Public endpoint: submit satisfaction rating (no auth — portal users)
// But we also mount under /api/satisfaction with auth for agent access
// The public submit is handled via portal routes

router.use(authenticate);

// Get rating for a conversation
router.get("/conversations/:conversationId/rating", async (req, res) => {
  const rating = await prisma.satisfactionRating.findFirst({
    where: { conversationId: req.params.conversationId as string },
  });
  res.json(rating);
});

// Submit a rating (authenticated — agents can submit on behalf)
router.post("/conversations/:conversationId/rating", async (req: AuthRequest, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }
  // Upsert — one rating per conversation
  const existing = await prisma.satisfactionRating.findFirst({
    where: { conversationId: req.params.conversationId as string },
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
        conversationId: req.params.conversationId as string,
        rating: parseInt(rating),
        comment,
      },
    });
  }
  res.status(201).json(result);
});

// List all ratings (admin only, for reports)
router.get("/", requireRole("admin"), async (_req, res) => {
  const ratings = await prisma.satisfactionRating.findMany({
    include: {
      conversation: { select: { id: true, subject: true, number: true } },
    },
    orderBy: { createdAt: "desc" as const },
  });
  res.json(ratings);
});

export default router;
