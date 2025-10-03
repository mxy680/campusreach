import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Return upcoming events with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const timeCommit = (searchParams.get("timeCommit") || "any").toLowerCase()

  // Determine current volunteer (if logged in) to compute alreadyJoined
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || null
  const vol = userId ? await prisma.volunteer.findUnique({ where: { userId }, select: { id: true } }) : null
  const myVolunteerId = vol?.id || null

  const where: Prisma.EventWhereInput = {}
  {
    const startsAt: Prisma.DateTimeFilter = {}
    if (from) {
      startsAt.gte = new Date(from)
    } else {
      // Default: hide past events
      startsAt.gte = new Date()
    }
    if (to) startsAt.lte = new Date(to)
    where.startsAt = startsAt
  }
  // Apply server-side filter for integer time commitment hours if requested
  if (timeCommit === "short") {
    where.timeCommitmentHours = { lte: 2 }
  } else if (timeCommit === "halfday") {
    where.timeCommitmentHours = { lte: 5 }
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { organization: { is: { name: { contains: q, mode: "insensitive" } } } },
      // Add description or other fields here if present in the schema
    ]
  }
  // Category filter against Event.categories (event-specific)
  // categories removed from schema; keeping param for forward compatibility but not filtering

  if (myVolunteerId) {
    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 60,
      include: {
        organization: { select: { name: true, categories: true, slug: true } },
        _count: { select: { signups: true } },
        signups: { select: { volunteerId: true, volunteer: { select: { firstName: true, lastName: true } } } },
      },
    })

    const rows = events.map((e) => ({
      id: e.id,
      title: e.title,
      org: e.organization?.name ?? "",
      orgSlug: e.organization?.slug ?? undefined,
      teaser: (e.shortDescription ?? "").replace(/Location:\s*[^\n]+/i, "").trim(),
      start: e.startsAt.toISOString(),
      end: e.endsAt ? e.endsAt.toISOString() : undefined,
      location: (() => {
        const loc = (e.location ?? "").trim()
        if (!loc || loc.toUpperCase() === "TBD") {
          const m = /Location:\s*([^\n]+)/i.exec(e.shortDescription ?? "")
          return (m?.[1]?.trim() || loc)
        }
        return loc
      })(),
      need: e.volunteersNeeded,
      joined: e._count.signups,
      attendees: e.signups.map((s) => `${s.volunteer.firstName} ${s.volunteer.lastName}`.trim()).slice(0, 8),
      skills: (e.specialties ?? []) as string[],
      hours: e.timeCommitmentHours ?? undefined,
      notes: e.notes ?? undefined,
      alreadyJoined: (e.signups ?? []).some((s) => s.volunteerId === myVolunteerId),
    }))

    return NextResponse.json({ data: rows })
  } else {
    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 60,
      include: {
        organization: { select: { name: true, categories: true, slug: true } },
        _count: { select: { signups: true } },
        signups: { select: { volunteer: { select: { firstName: true, lastName: true } } } },
      },
    })

    const rows = events.map((e) => ({
      id: e.id,
      title: e.title,
      org: e.organization?.name ?? "",
      orgSlug: e.organization?.slug ?? undefined,
      teaser: (e.shortDescription ?? "").replace(/Location:\s*[^\n]+/i, "").trim(),
      start: e.startsAt.toISOString(),
      end: e.endsAt ? e.endsAt.toISOString() : undefined,
      location: (() => {
        const loc = (e.location ?? "").trim()
        if (!loc || loc.toUpperCase() === "TBD") {
          const m = /Location:\s*([^\n]+)/i.exec(e.shortDescription ?? "")
          return (m?.[1]?.trim() || loc)
        }
        return loc
      })(),
      need: e.volunteersNeeded,
      joined: e._count.signups,
      attendees: e.signups.map((s) => `${s.volunteer.firstName} ${s.volunteer.lastName}`.trim()).slice(0, 8),
      skills: (e.specialties ?? []) as string[],
      hours: e.timeCommitmentHours ?? undefined,
      notes: e.notes ?? undefined,
      alreadyJoined: false,
    }))

    return NextResponse.json({ data: rows })
  }
}
