-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('VOLUNTEER', 'ORGANIZATION');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'VOLUNTEER';
