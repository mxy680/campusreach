import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/org/delete
// Deletes the organization associated with the current user's org email after verifying membership
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Resolve org via same logic as org/settings
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, id: true } })
    if (!user?.email) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
    if (!org?.id) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    // Ensure requester is a member (avoids delete via just email match)
    const member = await prisma.organizationMember.findFirst({ where: { organizationId: org.id, userId: session.user.id } })
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.organization.delete({ where: { id: org.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
