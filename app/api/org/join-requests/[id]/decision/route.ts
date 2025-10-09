import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/org/join-requests/[id]/decision
// body: { decision: "APPROVE" | "DECLINE" }
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const body = (await req.json().catch(() => null)) as { decision?: "APPROVE" | "DECLINE" } | null
    const decision = body?.decision
    if (decision !== "APPROVE" && decision !== "DECLINE") {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 })
    }

    // Load request and org
    const request = await prisma.organizationJoinRequest.findUnique({
      where: { id },
      select: { id: true, status: true, organizationId: true, userId: true },
    })
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (request.status !== "PENDING") return NextResponse.json({ error: "Already decided" }, { status: 400 })

    // Authorization: approver must be member or owner-by-email of this org
    const organizationId = request.organizationId
    let member = await prisma.organizationMember.findFirst({ where: { organizationId, userId: session.user.id } })
    if (!member) {
      const [user, org] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } }),
        prisma.organization.findUnique({ where: { id: organizationId }, select: { email: true, contactEmail: true } }),
      ])
      const isOwnerByEmail = !!(user?.email && org && (org.email === user.email || org.contactEmail === user.email))
      if (!isOwnerByEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      // Optional: backfill membership so future checks pass
      member = await prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId, userId: session.user.id } },
        create: { organizationId, userId: session.user.id },
        update: {},
      })
    }

    if (decision === "DECLINE") {
      await prisma.organizationJoinRequest.update({ where: { id }, data: { status: "DECLINED", decidedAt: new Date() } })
      return NextResponse.json({ ok: true })
    }

    // APPROVE
    await prisma.$transaction(async (tx) => {
      // Create membership
      await tx.organizationMember.upsert({
        where: { organizationId_userId: { organizationId, userId: request.userId } },
        create: { organizationId, userId: request.userId },
        update: {},
      })
      // Promote to ORGANIZATION and mark profile complete
      await tx.user.update({ where: { id: request.userId }, data: { role: "ORGANIZATION", profileComplete: true } })
      // Mark request approved
      await tx.organizationJoinRequest.update({ where: { id }, data: { status: "APPROVED", decidedAt: new Date() } })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/org/join-requests/[id]/decision error", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
