import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Load current organization's settings (name, contactEmail)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
  if (!user?.email) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const org = await prisma.organization.findFirst({
    where: { email: user.email },
    select: { id: true, name: true, contactEmail: true },
  })
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  return NextResponse.json({ id: org.id, name: org.name ?? "", contactEmail: org.contactEmail ?? "" })
}

// Update current organization's settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const name = (body?.name as string | undefined)?.trim()
  const contactEmail = (body?.contactEmail as string | undefined)?.trim()
  if (!name || !contactEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
  if (!user?.email) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
  if (!org?.id) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { name, contactEmail },
    select: { id: true, name: true, contactEmail: true },
  })

  return NextResponse.json({ id: updated.id, name: updated.name, contactEmail: updated.contactEmail })
}
