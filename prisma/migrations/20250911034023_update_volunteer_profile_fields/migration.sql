/*
  Warnings:

  - Added the required column `firstName` to the `Volunteer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Volunteer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Volunteer" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "graduationDate" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "pronouns" TEXT;
