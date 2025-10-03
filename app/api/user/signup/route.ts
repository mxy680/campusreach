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

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Accept eventId from either query string or JSON body
    const url = new URL(req.url)
    const qsEventId = url.searchParams.get("eventId")
    let bodyEventId: string | null = null
    try {
      const body = await req.json()
      if (body && typeof body.eventId === "string") bodyEventId = body.eventId
    } catch {
      // ignore if no JSON body
    }
    const eventId = (qsEventId || bodyEventId || "").trim()
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

    const volunteer = await prisma.volunteer.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    if (!volunteer) return NextResponse.json({ error: "Volunteer profile not found" }, { status: 400 })

    // Try to delete signup; if not present, treat as success (idempotent)
    await prisma.eventSignup.delete({
      where: { eventId_volunteerId: { eventId, volunteerId: volunteer.id } },
    }).catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/user/signup error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

