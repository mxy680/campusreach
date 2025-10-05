import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Derive org by user email (heuristic used elsewhere)
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
  let orgId: string | null = null
  if (user?.email) {
    const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
    orgId = org?.id ?? null
  }

  const where = orgId ? { organizationId: orgId } : {}
  const events: Array<{ id: string; title: string }> = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true },
  })

  const options = events.map((e: { id: string; title: string }) => ({ id: e.id, label: e.title }))
  return NextResponse.json({ data: options })
}
