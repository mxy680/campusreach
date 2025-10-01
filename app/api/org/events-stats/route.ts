import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = { month: string; events: number }

function monthKeyLong(d: Date) {
  return d.toLocaleString(undefined, { month: "long" })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

  const now = new Date()
  const start = new Date(now)
  start.setMonth(now.getMonth() - 5)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const events = await prisma.event.findMany({
    where: { organizationId: orgId, startsAt: { gte: start, lte: now } },
    select: { startsAt: true },
    orderBy: { startsAt: "asc" },
  })

  const months: Row[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    months.push({ month: monthKeyLong(d), events: 0 })
  }
  const map = new Map(months.map((m) => [m.month, m]))
  for (const e of events) {
    const key = monthKeyLong(e.startsAt)
    const row = map.get(key)
    if (row) row.events += 1
  }

  return NextResponse.json({ data: months })
}
