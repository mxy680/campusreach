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

    // Ensure requester is allowed: either a member, or the org owner (email match)
    let member = await prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: session.user.id } })
    if (!member) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
      const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { email: true, contactEmail: true } })
      const isOwnerByEmail = !!(user?.email && org && (org.email === user.email || org.contactEmail === user.email))
      if (!isOwnerByEmail) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      // Backfill membership for owner so future checks pass
      member = await prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
        create: { organizationId: orgId, userId: session.user.id },
        update: {},
      })
    }

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

// DELETE /api/org/members
// body: { orgId: string, userId: string }
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => null) as { orgId?: string; userId?: string } | null
    const orgId = body?.orgId
    const userId = body?.userId
    if (!orgId || !userId) return NextResponse.json({ error: "Missing orgId or userId" }, { status: 400 })

    // Only the org owner (email match) can remove members
    const [actingUser, org] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } }),
      prisma.organization.findUnique({ where: { id: orgId }, select: { email: true, contactEmail: true } }),
    ])
    const isOwner = !!(actingUser?.email && org && (org.email === actingUser.email || org.contactEmail === actingUser.email))
    if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Do not allow removing the owner account itself
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    if (target?.email && org && (target.email === org.email || target.email === org.contactEmail)) {
      return NextResponse.json({ error: "Cannot remove organization owner" }, { status: 400 })
    }

    // Delete membership and the user account. Other rows with FKs must be set to cascade or handled accordingly.
    await prisma.$transaction(async (tx) => {
      await tx.organizationMember.deleteMany({ where: { organizationId: orgId, userId } })
      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/org/members error", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
// POST /api/org/members { orgId }
// Links the CURRENT signed-in user as a member of orgId
// Authorization: user must have an approved join request OR be the org owner (email match)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await req.json().catch(() => ({})) as { orgId?: string }
    const orgId = body.orgId
    if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, email: true, contactEmail: true },
    })
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    // Authorization: user must have approved join request OR be owner by email
    const [user, approvedRequest] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } }),
      prisma.organizationJoinRequest.findFirst({
        where: { organizationId: orgId, userId: session.user.id, status: "APPROVED" },
        select: { id: true },
      }),
    ])

    const isOwnerByEmail = !!(
      user?.email && (org.email === user.email || org.contactEmail === user.email)
    )

    if (!approvedRequest && !isOwnerByEmail) {
      return NextResponse.json(
        { error: "Forbidden: You must have an approved join request or be the organization owner" },
        { status: 403 }
      )
    }

    // Upsert membership
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
      create: { organizationId: orgId, userId: session.user.id },
      update: {},
    })
    // Ensure user role is ORGANIZATION and mark profileComplete to bypass user onboarding
    await prisma.user.update({ where: { id: session.user.id }, data: { role: "ORGANIZATION", profileComplete: true } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
