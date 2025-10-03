import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const eventId: string | undefined = body?.eventId
    const volunteerId: string | undefined = body?.volunteerId
    if (!eventId || !volunteerId) {
      return NextResponse.json({ error: "Missing eventId or volunteerId" }, { status: 400 })
    }

    await prisma.eventSignup.delete({
      where: { eventId_volunteerId: {eventId, volunteerId } },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/org/volunteers error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get("eventId")
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

  const signups = await prisma.eventSignup.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      volunteer: {
        select: {
          id: true,
          slug: true,
          firstName: true,
          lastName: true,
          pronouns: true,
          major: true,
          graduationDate: true,
          phone: true,
          user: { select: { email: true, image: true } },
        },
      },
    },
  })

  const rows = signups.map((s, idx) => ({
    id: idx + 1, // table expects a number id
    volunteerId: s.volunteer?.id ?? undefined,
    volunteerSlug: s.volunteer?.slug ?? undefined,
    volunteerName: `${s.volunteer?.firstName ?? ""} ${s.volunteer?.lastName ?? ""}`.trim() || "Unknown",
    pronouns: s.volunteer?.pronouns ?? undefined,
    major: s.volunteer?.major ?? undefined,
    gradDate: s.volunteer?.graduationDate?.toISOString() ?? undefined,
    signedUpAt: s.createdAt.toISOString(),
    accepted: s.status === "CONFIRMED",
    email: s.volunteer?.user?.email ?? undefined,
    phone: s.volunteer?.phone ?? undefined,
    totalHours: undefined,
    notes: undefined,
    avatarUrl: s.volunteer?.user?.image ?? undefined,
  }))

  return NextResponse.json({ data: rows })
}
