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

  const entries = await prisma.timeEntry.findMany({
    where: { volunteerId: user.volunteer.id, date: { gte: start, lte: now } },
    select: { date: true, hours: true },
    orderBy: { date: "asc" },
  })

  const months: Row[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    months.push({ month: monthKey(d), hours: 0 })
  }

  const map = new Map(months.map((m) => [m.month, m]))
  for (const e of entries) {
    const key = monthKey(e.date)
    const row = map.get(key)
    if (row) row.hours += Number(e.hours)
  }

  return NextResponse.json({ data: months })
}
