/*
  Warnings:

  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Resource" DROP CONSTRAINT "Resource_organizationId_fkey";

-- DropTable
DROP TABLE "public"."Resource";

-- DropEnum
DROP TYPE "public"."ResourceKind";
