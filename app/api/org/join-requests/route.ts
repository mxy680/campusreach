import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/org/join-requests
// body: { organizationId: string, message?: string }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json().catch(() => null)) as { organizationId?: string; message?: string } | null
    const organizationId = body?.organizationId
    const message = (body?.message || "").slice(0, 500) || undefined
    if (!organizationId) return NextResponse.json({ error: "Missing organizationId" }, { status: 400 })

    // Verify org exists
    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } })
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    // If already a member, no-op
    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: session.user.id } },
    })
    if (existingMember) return NextResponse.json({ ok: true, alreadyMember: true })

    // If there is a pending request, ensure role is ORGANIZATION and return success
    const pending = await prisma.organizationJoinRequest.findFirst({
      where: { organizationId, userId: session.user.id, status: "PENDING" },
    })
    if (pending) {
      await prisma.user.update({ where: { id: session.user.id }, data: { role: "ORGANIZATION" } })
      return NextResponse.json({ ok: true, pending: true, id: pending.id })
    }

    const created = await prisma.organizationJoinRequest.create({
      data: { organizationId, userId: session.user.id, message },
      select: { id: true, createdAt: true },
    })
    // Immediately mark the user's role as ORGANIZATION (profileComplete remains false until approved)
    await prisma.user.update({ where: { id: session.user.id }, data: { role: "ORGANIZATION" } })
    return NextResponse.json({ ok: true, id: created.id })
  } catch (e) {
    console.error("POST /api/org/join-requests error", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// GET /api/org/join-requests?organizationId=...
// Returns pending join requests for an org (approvers only)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get("organizationId")
    if (!organizationId) return NextResponse.json({ error: "Missing organizationId" }, { status: 400 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Authorization: must be a member OR owner-by-email
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

    const requests = await prisma.organizationJoinRequest.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    return NextResponse.json({ data: requests })
  } catch (e) {
    console.error("GET /api/org/join-requests error", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
