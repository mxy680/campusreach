-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('STUDENT', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('WEEKLY_DIGEST', 'MESSAGE_NOTIFICATION', 'RATING_REMINDER');

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "emailUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "referenceId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageNotificationQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "messageIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "MessageNotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_email_key" ON "NotificationPreference"("email");

-- CreateIndex
CREATE INDEX "EmailLog_userId_type_sentAt_idx" ON "EmailLog"("userId", "type", "sentAt");

-- CreateIndex
CREATE INDEX "EmailLog_referenceId_type_idx" ON "EmailLog"("referenceId", "type");

-- CreateIndex
CREATE INDEX "MessageNotificationQueue_processedAt_idx" ON "MessageNotificationQueue"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageNotificationQueue_userId_eventId_key" ON "MessageNotificationQueue"("userId", "eventId");
