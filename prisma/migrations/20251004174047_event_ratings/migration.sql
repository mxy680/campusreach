-- CreateTable
CREATE TABLE "public"."EventRating" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventRating_eventId_idx" ON "public"."EventRating"("eventId");

-- CreateIndex
CREATE INDEX "EventRating_volunteerId_idx" ON "public"."EventRating"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRating_eventId_volunteerId_key" ON "public"."EventRating"("eventId", "volunteerId");

-- AddForeignKey
ALTER TABLE "public"."EventRating" ADD CONSTRAINT "EventRating_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventRating" ADD CONSTRAINT "EventRating_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "public"."Volunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
