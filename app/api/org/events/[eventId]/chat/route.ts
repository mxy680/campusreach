import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/org/events/[eventId]/chat?cursor=&limit=
export async function GET(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100)
  const cursor = searchParams.get("cursor") || undefined
  const { eventId } = await context.params

  // Permission: user must be an org member of the event's organization, or a volunteer signed up to the event
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, organizationId: true } })
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const isOrgMember = event.organizationId
    ? !!(await prisma.organizationMember.findFirst({ where: { organizationId: event.organizationId, userId: session.user.id }, select: { id: true } }))
    : false

  // Fallback: allow if user's email matches organization email/contactEmail
  let emailMatchesOrg = false
  if (event.organizationId && !isOrgMember) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    if (user?.email) {
      const org = await prisma.organization.findUnique({ where: { id: event.organizationId }, select: { email: true, contactEmail: true } })
      emailMatchesOrg = !!(org && (org.email === user.email || org.contactEmail === user.email))
    }
  }

  const isVolunteerInEvent = !!(await prisma.eventSignup.findFirst({ where: { eventId, volunteer: { userId: session.user.id } }, select: { id: true } }))

  if (!isOrgMember && !isVolunteerInEvent && !emailMatchesOrg) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Ensure there's a group chat for this event
  let gc = await prisma.groupChat.findUnique({ where: { eventId } })
  if (!gc) {
    gc = await prisma.groupChat.create({ data: { eventId } })
  }

  const messages = await prisma.chatMessage.findMany({
    where: { groupChatId: gc.id },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      createdAt: true,
      kind: true,
      body: true,
      user: { select: { id: true, name: true, image: true, email: true } },
    },
  })

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

  return NextResponse.json({ data: messages, nextCursor })
}

// POST /api/org/events/[eventId]/chat
// body: { body: string, kind?: "MESSAGE" | "ANNOUNCEMENT" }
export async function POST(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventId } = await context.params
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
  // Fallback: allow if user's email matches organization email/contactEmail
  let emailMatchesOrg = false
  if (event.organizationId && !isOrgMember) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    if (user?.email) {
      const org = await prisma.organization.findUnique({ where: { id: event.organizationId }, select: { email: true, contactEmail: true } })
      emailMatchesOrg = !!(org && (org.email === user.email || org.contactEmail === user.email))
    }
  }

  if (!isOrgMember && !isVolunteerInEvent && !emailMatchesOrg) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const resolvedKind: "MESSAGE" | "ANNOUNCEMENT" = kind === "ANNOUNCEMENT" && isOrgMember ? "ANNOUNCEMENT" : "MESSAGE"

  // Ensure there's a group chat
  let gc = await prisma.groupChat.findUnique({ where: { eventId } })
  if (!gc) gc = await prisma.groupChat.create({ data: { eventId } })

  const msg = await prisma.chatMessage.create({
    data: {
      groupChatId: gc.id,
      body: body.trim(),
      kind: resolvedKind,
      authorType: "USER",
      userId: session.user.id,
    },
    select: {
      id: true,
      createdAt: true,
      kind: true,
      body: true,
      user: { select: { id: true, name: true, image: true, email: true } },
    },
  })

  return NextResponse.json({ ok: true, data: msg })
}
