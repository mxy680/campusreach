import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = { month: string; hours: number }

function monthKey(d: Date) {
  return d.toLocaleString(undefined, { month: "short" })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, volunteer: { select: { id: true } } } })
  if (!user?.volunteer?.id) {
    return NextResponse.json({ data: [] as Row[] })
  }

  const now = new Date()
  const start = new Date(now)
  start.setMonth(now.getMonth() - 5)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  // Find events this volunteer signed up for in the last 6 months that are over
  const signups = await prisma.eventSignup.findMany({
    where: {
      volunteerId: user.volunteer.id,
      event: {
        OR: [
          { endsAt: { lt: now } },
          { AND: [{ endsAt: null }, { startsAt: { lt: now } }] },
        ],
        startsAt: { gte: start },
      },
    },
    select: {
      event: { select: { startsAt: true, endsAt: true, timeCommitmentHours: true } },
    },
    orderBy: { event: { startsAt: "asc" } },
    take: 1000,
  })

  const months: Row[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    months.push({ month: monthKey(d), hours: 0 })
  }
  const map = new Map(months.map((m) => [m.month, m]))

  for (const s of signups) {
    const ev = s.event
    if (!ev) continue
    const k = monthKey(ev.startsAt)
    const row = map.get(k)
    if (!row) continue
    let hrs = 0
    if (typeof ev.timeCommitmentHours === "number" && isFinite(ev.timeCommitmentHours)) {
      hrs = ev.timeCommitmentHours
    } else if (ev.endsAt) {
      const diffMs = Math.max(0, ev.endsAt.getTime() - ev.startsAt.getTime())
      hrs = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10
    }
    row.hours += hrs
  }

  return NextResponse.json({ data: months })
}
