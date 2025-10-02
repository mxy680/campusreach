import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/org/members?orgId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get("orgId")
    if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Ensure requester is a member of the org
    const member = await prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: session.user.id } })
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({ data: members })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE /api/org/members { orgId, userId }
// Removes a member from the organization. Requester must be a member.
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json().catch(() => ({})) as { orgId?: string; userId?: string }
    const orgId = body.orgId
    const userId = body.userId
    if (!orgId || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    // Ensure requester is a member of the org
    const requester = await prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: session.user.id } })
    if (!requester) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Prevent removing yourself to avoid lockout via UI (optional)
    // if (userId === session.user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })

    await prisma.organizationMember.delete({ where: { organizationId_userId: { organizationId: orgId, userId } } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
// POST /api/org/members { orgId }
// Links the CURRENT signed-in user as a member of orgId
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json().catch(() => ({})) as { orgId?: string }
    const orgId = body.orgId
    if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

    // Upsert membership
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
      create: { organizationId: orgId, userId: session.user.id },
      update: {},
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
