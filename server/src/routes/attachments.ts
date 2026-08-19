import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
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

// Local uploads directory
const uploadsDir = path.resolve(process.cwd(), "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
  /* ignore */
}

// Public routes (no auth) — local file serving
router.get("/local/:id/:filename", (req, res) => {
  const id = req.params.id;
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, id, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(filePath);
});

// Authenticated routes
router.use(authenticate);

router.post("/upload-url", async (req: AuthRequest, res) => {
  const { filename, contentType } = req.body;

  if (s3Client) {
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
    return;
  }

  // Local filesystem fallback
  const id = uuid();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${id}/${safeName}`;
  res.json({
    key,
    uploadUrl: `/api/attachments/local-upload/${key}`,
    url: `/api/attachments/local/${key}`,
    local: true,
  });
});

// Local upload endpoint (PUT with raw body)
router.put("/local-upload/:id/:filename", async (req, res) => {
  const id = req.params.id;
  const filename = req.params.filename;
  const dir = path.join(uploadsDir, id);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  const filePath = path.join(dir, filename);
  const writeStream = fs.createWriteStream(filePath);
  req.pipe(writeStream);
  writeStream.on("finish", () => res.json({ ok: true }));
  writeStream.on("error", () => res.status(500).json({ error: "Write failed" }));
});

export default router;
