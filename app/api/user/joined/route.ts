import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = { month: string; joined: number }

function monthKey(d: Date) {
  return d.toLocaleString(undefined, { month: "short" })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email }, select: { volunteer: { select: { id: true } } } })
  const volunteerId = user?.volunteer?.id
  if (!volunteerId) return NextResponse.json({ data: [] as Row[] })

  const now = new Date()
  const start = new Date(now)
  start.setMonth(now.getMonth() - 5)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const signups = await prisma.eventSignup.findMany({
    where: { volunteerId, createdAt: { gte: start, lte: now } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const months: Row[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    months.push({ month: monthKey(d), joined: 0 })
  }

  const map = new Map(months.map((m) => [m.month, m]))
  for (const s of signups) {
    const key = monthKey(s.createdAt)
    const row = map.get(key)
    if (row) row.joined += 1
  }

  return NextResponse.json({ data: months })
}
