import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
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

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;
    if (!userId) {
      socket.disconnect();
      return;
    }

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

    // Video signaling
    socket.on("video-offer", ({ roomId, offer, targetId }) => {
      socket
        .to(roomId)
        .except(socket.id)
        .emit("video-offer", { offer, senderId: userId, targetId });
    });

    socket.on("video-answer", ({ roomId, answer, targetId }) => {
      socket
        .to(roomId)
        .except(socket.id)
        .emit("video-answer", { answer, senderId: userId, targetId });
    });

    socket.on("ice-candidate", ({ roomId, candidate, targetId }) => {
      socket
        .to(roomId)
        .except(socket.id)
        .emit("ice-candidate", { candidate, senderId: userId, targetId });
    });
  });

  return io;
}
