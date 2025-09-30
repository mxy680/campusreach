import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = {
  id: string
  from: string
  subject: string
  date: string // ISO
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
      organization: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  })

  const rows: Row[] = convos.map((c) => ({
    id: c.id,
    from: c.organization?.name ?? "Conversation",
    subject: c.subject,
    date: (c.messages[0]?.createdAt ?? c.updatedAt).toISOString(),
  }))

  return NextResponse.json({ data: rows })
}
