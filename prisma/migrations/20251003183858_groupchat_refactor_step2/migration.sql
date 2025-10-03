/*
  Warnings:

  - You are about to drop the column `orgId` on the `ChatMessage` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MessageAuthorType" AS ENUM ('USER', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "public"."ChatMessage" DROP CONSTRAINT "ChatMessage_orgId_fkey";

-- AlterTable
ALTER TABLE "public"."ChatMessage" DROP COLUMN "orgId",
ADD COLUMN     "authorType" "public"."MessageAuthorType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "groupChatId" TEXT,
ALTER COLUMN "eventId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."GroupChat" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupChat_eventId_key" ON "public"."GroupChat"("eventId");

-- CreateIndex
CREATE INDEX "ChatMessage_groupChatId_createdAt_idx" ON "public"."ChatMessage"("groupChatId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."GroupChat" ADD CONSTRAINT "GroupChat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "public"."GroupChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
