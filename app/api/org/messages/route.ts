import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Returns recent conversations for the organization of the signed-in org user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Resolve org by the org user's email (same heuristic used elsewhere)
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
  if (!user?.email) return NextResponse.json({ data: [] })
  const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
  if (!org?.id) return NextResponse.json({ data: [] })

  const convos = await prisma.conversation.findMany({
    where: { organizationId: org.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      subject: true,
      updatedAt: true,
      volunteer: {
        select: {
          user: { select: { name: true, email: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, body: true } },
    },
  })

  const rows = convos.map((c) => ({
    id: c.id,
    name: c.volunteer?.user?.name ?? "Volunteer",
    email: c.volunteer?.user?.email ?? "",
    subject: c.subject,
    date: (c.messages[0]?.createdAt ?? c.updatedAt).toISOString(),
    teaser: c.messages[0]?.body ?? "",
  }))

  return NextResponse.json({ data: rows })
}
