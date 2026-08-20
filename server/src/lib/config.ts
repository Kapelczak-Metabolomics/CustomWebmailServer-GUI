import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

dotenv.config();

const SECRET_DIR = process.env.SECRET_DIR || "/app/data";

function ensureDir(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

function generateSecret(): string {
  return randomBytes(32).toString("hex");
}

function getOrCreateSecret(key: string, fileName: string): string {
  const envValue = process.env[key]?.trim();
  if (envValue) return envValue;

  const fallbackDir = "/tmp";
  const candidates = [
    path.join(SECRET_DIR, fileName),
    path.join(fallbackDir, fileName),
  ];

  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        return fs.readFileSync(file, "utf-8").trim();
      }
    } catch {
      /* ignore */
    }
  }

  const secret = generateSecret();
  for (const file of candidates) {
    try {
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, secret, { mode: 0o600 });
      return secret;
    } catch {
      /* try next */
    }
  }
  return secret;
}

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key]?.trim() ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function optionalList(key: string, fallback: string[]): string[] {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

function optionalString(key: string, fallback?: string): string | undefined {
  const raw = process.env[key]?.trim();
  return raw || fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000"),
  appHost: process.env.APP_HOST?.trim() || "0.0.0.0",
  clientUrl: optionalList("CLIENT_URL", ["http://localhost:8443"]),
  databaseUrl: requireEnv("DATABASE_URL"),
  redisUrl: requireEnv("REDIS_URL"),
  jwtSecret: getOrCreateSecret("JWT_SECRET", ".jwt-secret"),
  jwtExpiry: process.env.JWT_EXPIRY ?? "7d",
  s3: {
    endpoint: optionalString("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: optionalString("S3_BUCKET"),
    accessKeyId: optionalString("S3_ACCESS_KEY_ID"),
    secretAccessKey: optionalString("S3_SECRET_ACCESS_KEY"),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
  turn: {
    secret: getOrCreateSecret("TURN_SECRET", ".turn-secret"),
    realm: process.env.TURN_REALM ?? "isotopiq.local",
    // Auto-detect TURN host from CLIENT_URL if not explicitly set
    host: process.env.TURN_HOST ?? (() => {
      const clientUrl = process.env.CLIENT_URL;
      if (clientUrl) {
        try {
          return new URL(clientUrl).hostname;
        } catch {
          return "localhost";
        }
      }
      return "localhost";
    })(),
    ttl: parseInt(process.env.TURN_TTL ?? "86400"),
  },
  email: {
    defaultFrom:
      optionalString("EMAIL_DEFAULT_FROM") ?? "noreply@isotopiq.local",
  },
};
