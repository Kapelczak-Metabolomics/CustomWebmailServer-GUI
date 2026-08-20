import { Router } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  authenticate,
  requireRole,
  type AuthRequest,
} from "../middleware/auth.js";
import { prisma } from "../lib/db.js";
import { config } from "../lib/config.js";

const router: Router = Router();

const s3Enabled =
  config.s3.endpoint &&
  config.s3.bucket &&
  config.s3.accessKeyId &&
  config.s3.secretAccessKey;

const s3Client = s3Enabled
  ? new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId!,
        secretAccessKey: config.s3.secretAccessKey!,
      },
      forcePathStyle: config.s3.forcePathStyle,
    })
  : null;

async function resolveBrandUrl(keyOrUrl?: string | null) {
  if (!keyOrUrl) return null;
  if (keyOrUrl.startsWith("data:") || keyOrUrl.startsWith("http")) {
    return keyOrUrl;
  }
  if (!s3Client || !config.s3.bucket) return null;
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: keyOrUrl,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 604800 });
}

async function brandResponse(brand: any) {
  return {
    ...brand,
    logoUrl: await resolveBrandUrl(brand.logoS3Key),
    faviconUrl: await resolveBrandUrl(brand.faviconS3Key),
  };
}

router.get("/", async (_req, res) => {
  let brand = await prisma.brandSettings.findFirst();
  if (!brand) {
    brand = await prisma.brandSettings.create({ data: {} });
  }
  res.json(await brandResponse(brand));
});

router.patch(
  "/",
  authenticate,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    let brand = await prisma.brandSettings.findFirst();
    const data = { ...req.body };
    delete data.id;
    delete data.logoUrl;
    delete data.faviconUrl;

    if (!brand) {
      brand = await prisma.brandSettings.create({ data });
    } else {
      brand = await prisma.brandSettings.update({
        where: { id: brand.id },
        data,
      });
    }
    res.json(await brandResponse(brand));
  },
);

export default router;
