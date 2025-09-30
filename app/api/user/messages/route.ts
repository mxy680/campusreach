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
