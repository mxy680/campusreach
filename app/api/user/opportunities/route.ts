import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// Return upcoming events with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  // const category = searchParams.get("category") || "any"
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  // timeCommit is currently handled client-side because duration may be missing
  // const timeCommit = searchParams.get("timeCommit")

  const now = new Date()

  const startsAt: Prisma.DateTimeFilter = { gte: from ? new Date(from) : now }
  if (to) {
    startsAt.lte = new Date(to)
  }
  const where: Prisma.EventWhereInput = { startsAt }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { organization: { is: { name: { contains: q, mode: "insensitive" } } } },
      // Add description or other fields here if present in the schema
    ]
  }
  // Note: category filtering is client-side until Event has categories in the schema

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    take: 60,
    select: {
      id: true,
      title: true,
      startsAt: true,
      // endsAt may not exist in schema; if it does, add it here
      location: true,
      volunteersNeeded: true,
      organization: { select: { name: true } },
      _count: { select: { signups: true } },
    },
  })

  const rows = events.map((e) => ({
    id: e.id,
    title: e.title,
    org: e.organization?.name ?? "",
    teaser: "",
    start: e.startsAt.toISOString(),
    end: undefined as string | undefined,
    location: e.location,
    need: e.volunteersNeeded,
    joined: e._count.signups,
    categories: [] as string[],
    skills: [] as string[],
    pointsPerHour: undefined as number | undefined,
  }))

  return NextResponse.json({ data: rows })
}
