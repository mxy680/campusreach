/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Volunteer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Volunteer" DROP CONSTRAINT "Volunteer_organizationId_fkey";

-- AlterTable
ALTER TABLE "public"."Volunteer" DROP COLUMN "organizationId";
