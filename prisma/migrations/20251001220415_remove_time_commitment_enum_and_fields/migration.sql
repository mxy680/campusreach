/*
  Warnings:

  - You are about to drop the column `categories` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `pointsPerHour` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `timeCommitment` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `timeCommitmentNote` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "categories",
DROP COLUMN "pointsPerHour",
DROP COLUMN "timeCommitment",
DROP COLUMN "timeCommitmentNote",
ADD COLUMN     "notes" TEXT;

-- DropEnum
DROP TYPE "public"."TimeCommitment";
