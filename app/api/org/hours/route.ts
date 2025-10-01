import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = { month: string; hours: number }

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

  const entries = await prisma.timeEntry.findMany({
    where: { date: { gte: start, lte: now }, event: { organizationId: orgId } },
    select: { date: true, hours: true },
    orderBy: { date: "asc" },
  })

  const months: Row[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    months.push({ month: monthKeyLong(d), hours: 0 })
  }
  const map = new Map(months.map((m) => [m.month, m]))
  for (const e of entries) {
    const key = monthKeyLong(e.date)
    const row = map.get(key)
    if (row) row.hours += Number(e.hours)
  }

  return NextResponse.json({ data: months })
}
