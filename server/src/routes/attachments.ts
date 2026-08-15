import { Router } from "express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
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

router.use(authenticate);

router.post("/upload-url", async (req: AuthRequest, res) => {
  if (!s3Client) {
    res.status(503).json({ error: "S3 is not configured" });
    return;
  }
  const { filename, contentType } = req.body;
  const key = `attachments/${req.user!.id}/${uuid()}/${filename}`;
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket!,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const getCommand = new GetObjectCommand({
    Bucket: config.s3.bucket!,
    Key: key,
  });
  const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 86400 });
  res.json({ key, uploadUrl, url });
});

export default router;
