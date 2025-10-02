-- CreateEnum
CREATE TYPE "public"."OrgMemberRole" AS ENUM ('OWNER', 'ADMIN', 'VIEWER');

-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "allowedEmailDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."OrganizationMember" ADD COLUMN     "role" "public"."OrgMemberRole" NOT NULL DEFAULT 'VIEWER';

-- CreateTable
CREATE TABLE "public"."OrgInvite" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."OrgMemberRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgInvite_token_key" ON "public"."OrgInvite"("token");

-- AddForeignKey
ALTER TABLE "public"."OrgInvite" ADD CONSTRAINT "OrgInvite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgInvite" ADD CONSTRAINT "OrgInvite_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
