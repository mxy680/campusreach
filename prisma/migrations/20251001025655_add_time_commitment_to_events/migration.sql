-- CreateEnum
CREATE TYPE "TimeCommitment" AS ENUM ('SHORT', 'HALF_DAY', 'FULL_DAY', 'FLEXIBLE');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "timeCommitment" "TimeCommitment";
