-- AlterTable: add guest + recording fields to VideoRoom
ALTER TABLE "VideoRoom" ADD COLUMN "allowGuests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "recordingActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "recordingUrl" TEXT;

-- AlterTable: make userId nullable + add guestName to VideoRoomMember
ALTER TABLE "VideoRoomMember" ADD COLUMN "guestName" TEXT;
ALTER TABLE "VideoRoomMember" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable: VideoRoomMessage
CREATE TABLE "VideoRoomMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoRoomMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VideoRoomMessage" ADD CONSTRAINT "VideoRoomMessage_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "VideoRoom"("id") ON DELETE CASCADE;

-- Drop old FK and add SetNull FK for VideoRoomMember
ALTER TABLE "VideoRoomMember" DROP CONSTRAINT "VideoRoomMember_userId_fkey";
ALTER TABLE "VideoRoomMember" ADD CONSTRAINT "VideoRoomMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
