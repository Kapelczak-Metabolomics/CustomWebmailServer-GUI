import { Router } from "express";
import {
  authenticate,
  requireRole,
  type AuthRequest,
} from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const router: Router = Router();

router.use(authenticate);

router.get("/", async (_req, res) => {
  let settings = await prisma.appSettings.findFirst();
  if (!settings) {
    settings = await prisma.appSettings.create({ data: {} });
  }
  res.json(settings);
});

router.patch(
  "/",
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    let settings = await prisma.appSettings.findFirst();
    const data = { ...req.body };
    delete data.id;
    if (!settings) {
      settings = await prisma.appSettings.create({ data });
    } else {
      settings = await prisma.appSettings.update({
        where: { id: settings.id },
        data,
      });
    }
    res.json(settings);
  },
);

export default router;
