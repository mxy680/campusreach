import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = { month: string; students: number; orgs: number }

function monthKey(d: Date) {
  return d.toLocaleString(undefined, { month: "short" })
}

export async function GET() {
  const now = new Date()
  const start = new Date(now)
  start.setMonth(now.getMonth() - 5)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  // Pull volunteers and organizations created in the last 6 months
  const [volunteers, orgs] = await Promise.all([
    prisma.volunteer.findMany({ select: { createdAt: true }, where: { createdAt: { gte: start, lte: now } }, orderBy: { createdAt: "asc" } }),
    prisma.organization.findMany({ select: { createdAt: true }, where: { createdAt: { gte: start, lte: now } }, orderBy: { createdAt: "asc" } }),
  ])

  const months: Row[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    months.push({ month: monthKey(d), students: 0, orgs: 0 })
  }

  const map = new Map(months.map((m) => [m.month, m]))
  for (const v of volunteers) {
    const key = monthKey(v.createdAt)
    const row = map.get(key)
    if (row) row.students += 1
  }
  for (const o of orgs) {
    const key = monthKey(o.createdAt)
    const row = map.get(key)
    if (row) row.orgs += 1
  }

  return NextResponse.json({ data: months })
}
