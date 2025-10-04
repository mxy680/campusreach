import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/org/ratings-distribution?orgId=
// Returns counts of ratings 1..5 for events belonging to the organization
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

  // Find events for the org
  const events = await prisma.event.findMany({ where: { organizationId: orgId }, select: { id: true }, take: 5000 })
  const eventIds = events.map((e) => e.id)
  if (eventIds.length === 0) return NextResponse.json({ data: [0, 0, 0, 0, 0] })

  // Group ratings by "rating" across those events
  const grouped = await prisma.eventRating.groupBy({
    by: ["rating"],
    _count: { _all: true },
    where: { eventId: { in: eventIds } },
  })

  const counts = [0, 0, 0, 0, 0]
  for (const g of grouped) {
    const idx = Math.min(5, Math.max(1, g.rating)) - 1
    counts[idx] = g._count._all
  }

  return NextResponse.json({ data: counts })
}
