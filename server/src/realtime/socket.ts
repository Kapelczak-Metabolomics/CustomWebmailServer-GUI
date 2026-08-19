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
          include: {
            user: { select: { id: true, name: true, email: true } },
            receipts: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        });
        io.to(roomId).emit("new-message", msg);

        // Auto-create "delivered" receipts for all other room members
        const members = await prisma.chatRoomMember.findMany({
          where: { roomId, userId: { not: userId } },
        });
        for (const member of members) {
          await prisma.chatMessageReceipt.upsert({
            where: {
              messageId_userId: { messageId: msg.id, userId: member.userId },
            },
            create: {
              messageId: msg.id,
              userId: member.userId,
              deliveredAt: new Date(),
            },
            update: { deliveredAt: new Date() },
          });
        }

        // Emit delivered event to the sender
        const senderSockets = userSockets.get(userId);
        if (senderSockets) {
          for (const sid of senderSockets) {
            io.to(sid).emit("message-delivered", {
              messageId: msg.id,
              roomId,
              deliveredAt: new Date().toISOString(),
              recipientIds: members.map((m) => m.userId),
            });
          }
        }
      },
    );

    // Mark message as read
    socket.on(
      "mark-read",
      async ({ roomId, messageIds }: { roomId: string; messageIds: string[] }) => {
        // Check if user has read receipts enabled or admin forces it
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { readReceiptsEnabled: true, name: true },
        });
        const appSettings = await prisma.appSettings.findFirst();
        const forceReadReceipts = appSettings?.forceReadReceipts ?? false;
        const receiptsEnabled = forceReadReceipts || user?.readReceiptsEnabled;

        const readAt = new Date();
        for (const messageId of messageIds) {
          await prisma.chatMessageReceipt.upsert({
            where: { messageId_userId: { messageId, userId } },
            create: { messageId, userId, readAt },
            update: { readAt },
          });
        }

        // Notify the message sender(s) that their messages were read
        const messages = await prisma.chatMessage.findMany({
          where: { id: { in: messageIds } },
          select: { userId: true },
        });
        const senderIds = [...new Set(messages.map((m) => m.userId))];

        for (const senderId of senderIds) {
          if (senderId === userId) continue;
          const senderSockets = userSockets.get(senderId);
          if (senderSockets) {
            for (const sid of senderSockets) {
              io.to(sid).emit("message-read", {
                messageIds,
                roomId,
                readAt: readAt.toISOString(),
                readBy: userId,
                readByName: user?.name || "User",
                receiptsEnabled,
              });
            }
          }
        }
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
