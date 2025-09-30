import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = {
  id: string
  name: string
  email: string
  subject: string
  date: string // ISO
  teaser: string
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { email, orgId, subject, body: messageBody } = (body || {}) as {
    email?: string
    orgId?: string
    subject?: string
    body?: string
  }
  if (!email || !orgId || !subject || !messageBody) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, volunteer: { select: { id: true } } } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const convo = await prisma.conversation.create({
    data: {
      subject,
      volunteerId: user.volunteer?.id ?? null,
      organizationId: orgId,
      createdByUserId: user.id,
      messages: {
        create: [{ body: messageBody, fromUserId: user.id }],
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: convo.id })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return NextResponse.json({ data: [] as Row[] })

  // Conversations where the user is the volunteer or creator
  const convos = await prisma.conversation.findMany({
    where: {
      OR: [
        { createdByUserId: user.id },
        { volunteer: { userId: user.id } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      subject: true,
      updatedAt: true,
      organization: { select: { name: true, contactEmail: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, body: true } },
    },
  })

  const rows: Row[] = convos.map((c) => ({
    id: c.id,
    name: c.organization?.name ?? "Conversation",
    email: c.organization?.contactEmail ?? "",
    subject: c.subject,
    date: (c.messages[0]?.createdAt ?? c.updatedAt).toISOString(),
    teaser: c.messages[0]?.body ?? "",
  }))

  return NextResponse.json({ data: rows })
}
