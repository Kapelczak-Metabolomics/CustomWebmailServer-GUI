import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../lib/config.js";
import { prisma } from "../lib/db.js";

export function setupSocket(
  httpServer: HttpServer,
  allowedOrigin: string | string[],
) {
  const origins = Array.isArray(allowedOrigin)
    ? allowedOrigin
    : [allowedOrigin];
  const io = new Server(httpServer, {
    cors: { origin: origins, credentials: true },
  });

  // userId -> Set<socketId> for targeted delivery
  const userSockets = new Map<string, Set<string>>();

  function getUserIdFromSocket(socket: any): string | null {
    // Try cookie first
    const cookie = socket.handshake.headers.cookie as string | undefined;
    if (cookie) {
      const match = cookie.match(/token=([^;]+)/);
      if (match) {
        try {
          const payload = jwt.verify(match[1], config.jwtSecret) as { id: string };
          return payload.id;
        } catch {
          /* fall through */
        }
      }
    }
    // Try auth token
    const authToken = socket.handshake.auth?.token as string | undefined;
    if (authToken) {
      try {
        const payload = jwt.verify(authToken, config.jwtSecret) as { id: string };
        return payload.id;
      } catch {
        /* fall through */
      }
    }
    return null;
  }

  io.on("connection", (socket) => {
    const userId = getUserIdFromSocket(socket);
    if (!userId) {
      socket.disconnect();
      return;
    }
    socket.data.userId = userId;

    // Track socket per user
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);

    socket.on("join-room", async (roomId: string) => {
      await socket.join(roomId);
      socket.to(roomId).emit("user-joined", { userId });
    });

    socket.on("leave-room", (roomId: string) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user-left", { userId });
    });

    socket.on(
      "send-message",
      async ({ roomId, body }: { roomId: string; body: string }) => {
        const msg = await prisma.chatMessage.create({
          data: { roomId, userId, body },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        io.to(roomId).emit("new-message", msg);
      },
    );

    // Video signaling — targeted delivery to specific user
    socket.on("video-offer", ({ roomId, offer, targetId }) => {
      const targets = userSockets.get(targetId);
      if (targets) {
        for (const sid of targets) {
          io.to(sid).emit("video-offer", { offer, senderId: userId, targetId });
        }
      }
    });

    socket.on("video-answer", ({ roomId, answer, targetId }) => {
      const targets = userSockets.get(targetId);
      if (targets) {
        for (const sid of targets) {
          io.to(sid).emit("video-answer", { answer, senderId: userId, targetId });
        }
      }
    });

    socket.on("ice-candidate", ({ roomId, candidate, targetId }) => {
      const targets = userSockets.get(targetId);
      if (targets) {
        for (const sid of targets) {
          io.to(sid).emit("ice-candidate", { candidate, senderId: userId, targetId });
        }
      }
    });

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });
  });

  return io;
}
