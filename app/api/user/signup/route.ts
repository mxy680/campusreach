import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await req.json()
    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
    }

    const volunteer = await prisma.volunteer.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    if (!volunteer) {
      return NextResponse.json({ error: "Volunteer profile not found" }, { status: 400 })
    }

    await prisma.eventSignup.upsert({
      where: { eventId_volunteerId: { eventId, volunteerId: volunteer.id } },
      create: { eventId, volunteerId: volunteer.id, status: "CONFIRMED" },
      update: {},
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/user/signup error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
