import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = { org: string; count: number }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email },
    select: { volunteer: { select: { id: true } } },
  })
  const volunteerId = user?.volunteer?.id
  if (!volunteerId) return NextResponse.json({ data: [] as Row[] })

  const now = new Date()
  const start = new Date(now)
  start.setMonth(now.getMonth() - 5)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const signups = await prisma.eventSignup.findMany({
    where: { volunteerId, createdAt: { gte: start, lte: now } },
    select: { event: { select: { organization: { select: { name: true } } } } },
  })

  const counts = new Map<string, number>()
  for (const s of signups) {
    const name = s.event?.organization?.name || "Other"
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  const data: Row[] = Array.from(counts.entries())
    .map(([org, count]) => ({ org, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ data })
}
