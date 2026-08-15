import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import path from "path";

import { config } from "./lib/config.js";
import { prisma } from "./lib/db.js";
import { pingRedis } from "./lib/redis.js";
import { setupSocket } from "./realtime/socket.js";
import { scheduleEmailFetch } from "./services/workers.js";
import { errorHandler, notFound } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import mailboxRoutes from "./routes/mailboxes.js";
import contactRoutes from "./routes/contacts.js";
import conversationRoutes from "./routes/conversations.js";
import messageRoutes from "./routes/messages.js";
import attachmentRoutes from "./routes/attachments.js";
import chatRoutes from "./routes/chat.js";
import videoRoutes from "./routes/video.js";
import brandRoutes from "./routes/brand.js";

const app = express();
const httpServer = createServer(app);

app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin:
      config.clientUrl.length === 1 ? config.clientUrl[0] : config.clientUrl,
    credentials: true,
  }),
);

// Healthcheck
app.get("/api/health", async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);
  const redisOk = await pingRedis()
    .then(() => true)
    .catch(() => false);
  res.json({
    status: dbOk && redisOk ? "ok" : "degraded",
    db: dbOk,
    redis: redisOk,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mailboxes", mailboxRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/brand", brandRoutes);

// Serve React SPA from built client
const publicDir = path.resolve(process.cwd(), "public");
app.use(express.static(publicDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

setupSocket(httpServer, config.clientUrl);

httpServer.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
  scheduleEmailFetch().catch(console.error);
});
