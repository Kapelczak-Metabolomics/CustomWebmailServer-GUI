import { Router } from "express";
import {
  authenticate,
  requireRole,
  type AuthRequest,
} from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.get("/", async (_req, res) => {
  let brand = await prisma.brandSettings.findFirst();
  if (!brand) {
    brand = await prisma.brandSettings.create({ data: {} });
  }
  res.json(brand);
});

router.patch(
  "/",
  authenticate,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    let brand = await prisma.brandSettings.findFirst();
    if (!brand) {
      brand = await prisma.brandSettings.create({ data: req.body });
    } else {
      brand = await prisma.brandSettings.update({
        where: { id: brand.id },
        data: req.body,
      });
    }
    res.json(brand);
  },
);

export default router;
