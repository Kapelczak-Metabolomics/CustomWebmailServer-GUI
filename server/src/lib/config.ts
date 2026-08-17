import dotenv from "dotenv";

dotenv.config();

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

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000"),
  appHost: process.env.APP_HOST?.trim() || "0.0.0.0",
  clientUrl: optionalList("CLIENT_URL", ["http://localhost:8443"]),
  databaseUrl: requireEnv("DATABASE_URL"),
  redisUrl: requireEnv("REDIS_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiry: process.env.JWT_EXPIRY ?? "7d",
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
  turn: {
    secret: process.env.TURN_SECRET,
    realm: process.env.TURN_REALM ?? "isotopiq.local",
    ttl: parseInt(process.env.TURN_TTL ?? "86400"),
  },
  email: {
    defaultFrom: process.env.EMAIL_DEFAULT_FROM,
  },
};
