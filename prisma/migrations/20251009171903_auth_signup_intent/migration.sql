-- CreateEnum
CREATE TYPE "SignupIntentKind" AS ENUM ('ORG_CREATE', 'ORG_JOIN', 'USER_SIGNUP');

-- CreateTable
CREATE TABLE "SignupIntent" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "kind" "SignupIntentKind" NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "SignupIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupIntent_token_key" ON "SignupIntent"("token");

-- CreateIndex
CREATE INDEX "SignupIntent_organizationId_kind_idx" ON "SignupIntent"("organizationId", "kind");

-- CreateIndex
CREATE INDEX "SignupIntent_email_kind_idx" ON "SignupIntent"("email", "kind");

-- AddForeignKey
ALTER TABLE "SignupIntent" ADD CONSTRAINT "SignupIntent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
