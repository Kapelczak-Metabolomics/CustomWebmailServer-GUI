import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000"),
  appHost: process.env.APP_HOST ?? "localhost",
  clientUrl: process.env.CLIENT_URL?.split(",").map((u) => u.trim()) ?? [
    "http://localhost:8443",
  ],
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
