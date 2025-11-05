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

    // Resolve org by email and enforce OWNER-only (email or contactEmail match)
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    if (!user?.email) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    const org = await prisma.organization.findFirst({ where: { OR: [{ email: user.email }, { contactEmail: user.email }] }, select: { id: true, email: true, contactEmail: true } })
    if (!org?.id) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    const isOwner = org.email === user.email || org.contactEmail === user.email
    if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.organization.delete({ where: { id: org.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
