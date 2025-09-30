import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      volunteer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          school: true,
          major: true,
          graduationDate: true,
          phone: true,
          transportMode: true,
          radiusMiles: true,
          transportNotes: true,
        },
      },
    },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const [timeEntries, signups, conversations] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { volunteer: { userId: user.id } },
      orderBy: { date: "asc" },
    }),
    prisma.eventSignup.findMany({
      where: { volunteer: { userId: user.id } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        event: { select: { id: true, title: true, startsAt: true, location: true, organization: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversation.findMany({
      where: { OR: [{ createdByUserId: user.id }, { volunteer: { userId: user.id } }] },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { id: true, name: true } },
        messages: {
          select: { id: true, createdAt: true, body: true, fromUserId: true, fromOrgId: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    timeEntries,
    signups,
    conversations,
  }

  return NextResponse.json(payload)
}
