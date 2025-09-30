import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Reset activity: remove user's signups and logged hours only
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = body?.email as string | undefined
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, volunteer: { select: { id: true } } } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (!user.volunteer?.id) {
    return NextResponse.json({ ok: true, deleted: { signups: 0, timeEntries: 0 } })
  }

  const volunteerId = user.volunteer.id
  const result = await prisma.$transaction(async (tx) => {
    const delSignups = await tx.eventSignup.deleteMany({ where: { volunteerId } })
    const delHours = await tx.timeEntry.deleteMany({ where: { volunteerId } })
    return { signups: delSignups.count, timeEntries: delHours.count }
  })

  return NextResponse.json({ ok: true, deleted: result })
}
