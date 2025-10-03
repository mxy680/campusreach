/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Volunteer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Volunteer" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Volunteer_slug_key" ON "public"."Volunteer"("slug");
