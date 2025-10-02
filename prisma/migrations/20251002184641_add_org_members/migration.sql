/*
  Warnings:

  - You are about to drop the `OrgInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrgMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrgInvite" DROP CONSTRAINT "OrgInvite_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrgMember" DROP CONSTRAINT "OrgMember_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrgMember" DROP CONSTRAINT "OrgMember_userId_fkey";

-- DropTable
DROP TABLE "public"."OrgInvite";

-- DropTable
DROP TABLE "public"."OrgMember";

-- DropEnum
DROP TYPE "public"."OrgRole";

-- CreateTable
CREATE TABLE "public"."OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "public"."OrganizationMember"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
