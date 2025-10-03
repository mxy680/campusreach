import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/org/events/[eventId]/chat?cursor=&limit=
export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100)
  const cursor = searchParams.get("cursor") || undefined
  const eventId = params.eventId

  // Permission: user must be an org member of the event's organization, or a volunteer signed up to the event
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, organizationId: true } })
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const isOrgMember = event.organizationId
    ? !!(await prisma.organizationMember.findFirst({ where: { organizationId: event.organizationId, userId: session.user.id }, select: { id: true } }))
    : false

  const isVolunteerInEvent = !!(await prisma.eventSignup.findFirst({ where: { eventId, volunteer: { userId: session.user.id } }, select: { id: true } }))

  if (!isOrgMember && !isVolunteerInEvent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const messages = await prisma.chatMessage.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      createdAt: true,
      kind: true,
      body: true,
      user: { select: { id: true, name: true, image: true, email: true } },
      organization: { select: { id: true, name: true, logoUrl: true, slug: true } },
    },
  })

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

  return NextResponse.json({ data: messages, nextCursor })
}

// POST /api/org/events/[eventId]/chat
// body: { body: string, kind?: "MESSAGE" | "ANNOUNCEMENT" }
export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const eventId = params.eventId
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, organizationId: true } })
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const { body, kind } = await req.json()
  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return NextResponse.json({ error: "Message body required" }, { status: 400 })
  }

  // Only org members of this event's org can send ANNOUNCEMENTs; others default to MESSAGE
  const isOrgMember = event.organizationId
    ? !!(await prisma.organizationMember.findFirst({ where: { organizationId: event.organizationId, userId: session.user.id }, select: { id: true } }))
    : false

  // Permit posting if org member or signed-up volunteer
  const isVolunteerInEvent = !!(await prisma.eventSignup.findFirst({ where: { eventId, volunteer: { userId: session.user.id } }, select: { id: true } }))
  if (!isOrgMember && !isVolunteerInEvent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const resolvedKind: "MESSAGE" | "ANNOUNCEMENT" = kind === "ANNOUNCEMENT" && isOrgMember ? "ANNOUNCEMENT" : "MESSAGE"

  const msg = await prisma.chatMessage.create({
    data: {
      eventId,
      body: body.trim(),
      kind: resolvedKind as any,
      userId: session.user.id,
      orgId: isOrgMember ? event.organizationId : null,
    },
    select: {
      id: true,
      createdAt: true,
      kind: true,
      body: true,
      user: { select: { id: true, name: true, image: true, email: true } },
      organization: { select: { id: true, name: true, logoUrl: true, slug: true } },
    },
  })

  return NextResponse.json({ ok: true, data: msg })
}
