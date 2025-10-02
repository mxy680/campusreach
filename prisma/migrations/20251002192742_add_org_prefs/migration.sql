/*
  Warnings:

  - You are about to drop the column `allowedEmailDomains` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `OrganizationMember` table. All the data in the column will be lost.
  - You are about to drop the `OrgInvite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrgInvite" DROP CONSTRAINT "OrgInvite_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrgInvite" DROP CONSTRAINT "OrgInvite_orgId_fkey";

-- AlterTable
ALTER TABLE "public"."Organization" DROP COLUMN "allowedEmailDomains",
ADD COLUMN     "defaultEventLocationTemplate" TEXT,
ADD COLUMN     "defaultTimeCommitmentHours" INTEGER,
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "public"."OrganizationMember" DROP COLUMN "role";

-- DropTable
DROP TABLE "public"."OrgInvite";

-- DropEnum
DROP TYPE "public"."OrgMemberRole";
