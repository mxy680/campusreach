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

  const user = await prisma.user.findUnique({
    where: { email },
    select: { volunteer: { select: { id: true } } },
  })
  const volunteerId = user?.volunteer?.id
  if (!volunteerId) return NextResponse.json({ data: [] as Row[] })

  const now = new Date()
  const upcoming = await prisma.eventSignup.findMany({
    where: {
      volunteerId,
      event: { startsAt: { gte: now } },
    },
    orderBy: { event: { startsAt: "asc" } },
    take: 5,
    select: {
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,
          volunteersNeeded: true,
          organization: { select: { name: true } },
          _count: { select: { signups: true } },
        },
      },
    },
  })

  const rows: Row[] = upcoming
    .filter((e) => !!e.event)
    .map((e) => ({
      id: e.event!.id,
      title: e.event!.title,
      org: e.event!.organization?.name ?? "",
      when: e.event!.startsAt.toISOString(),
      location: e.event!.location,
      need: e.event!.volunteersNeeded,
      joined: e.event!._count.signups,
    }))

  return NextResponse.json({ data: rows })
}
