-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "officeHours" TEXT,
    "defaultMailboxId" TEXT,
    "autoReply" BOOLEAN NOT NULL DEFAULT false,
    "whiteLabel" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
