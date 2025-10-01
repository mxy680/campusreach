import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = {
  id: string
  title: string
  org: string
  when: string
  location: string
  need: number
  joined: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email }, select: { volunteer: { select: { id: true } } } })
  const volunteerId = user?.volunteer?.id
  if (!volunteerId) return NextResponse.json({ data: [] as Row[] })

  const now = new Date()
  const events = await prisma.event.findMany({
    where: {
      startsAt: { gte: now },
      signups: { none: { volunteerId } },
    },
    orderBy: { startsAt: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      startsAt: true,
      shortDescription: true,
      location: true,
      volunteersNeeded: true,
      organization: { select: { name: true } },
      _count: { select: { signups: true } },
    },
  })

  const rows: Row[] = events.map((e) => {
    // Prefer the explicit Event.location; if missing or 'TBD', try to parse from shortDescription
    let loc = e.location?.trim()
    if (!loc || loc.toUpperCase() === "TBD") {
      const m = /Location:\s*([^\n]+)/i.exec(e.shortDescription ?? "")
      loc = m?.[1]?.trim() || (loc || "")
    }
    return {
      id: e.id,
      title: e.title,
      org: e.organization?.name ?? "",
      when: e.startsAt.toISOString(),
      location: loc || "",
      need: e.volunteersNeeded,
      joined: e._count.signups,
    }
  })

  return NextResponse.json({ data: rows })
}
