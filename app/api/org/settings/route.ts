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
    select: { id: true, name: true, contactEmail: true, timezone: true, locale: true, defaultEventLocationTemplate: true, defaultTimeCommitmentHours: true, defaultVolunteersNeeded: true },
  })
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  return NextResponse.json({
    id: org.id,
    name: org.name ?? "",
    contactEmail: org.contactEmail ?? "",
    timezone: org.timezone ?? null,
    locale: org.locale ?? null,
    defaultEventLocationTemplate: org.defaultEventLocationTemplate ?? null,
    defaultTimeCommitmentHours: org.defaultTimeCommitmentHours ?? null,
    defaultVolunteersNeeded: org.defaultVolunteersNeeded ?? null,
  })
}

// Update current organization's settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const name = (body?.name as string | undefined)?.trim()
  const contactEmail = (body?.contactEmail as string | undefined)?.trim()
  const timezone = (body?.timezone as string | undefined)?.trim() || null
  const locale = (body?.locale as string | undefined)?.trim() || null
  const defaultEventLocationTemplate = (body?.defaultEventLocationTemplate as string | undefined)?.trim() || null
  const defaultTimeCommitmentHours = body?.defaultTimeCommitmentHours as number | undefined
  const defaultVolunteersNeeded = body?.defaultVolunteersNeeded as number | undefined
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
  if (!user?.email) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
  if (!org?.id) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      name,
      ...(contactEmail ? { contactEmail } : {}),
      timezone,
      locale,
      defaultEventLocationTemplate,
      defaultTimeCommitmentHours: defaultTimeCommitmentHours ?? null,
      defaultVolunteersNeeded: defaultVolunteersNeeded ?? null,
    },
    select: { id: true, name: true, contactEmail: true, timezone: true, locale: true, defaultEventLocationTemplate: true, defaultTimeCommitmentHours: true, defaultVolunteersNeeded: true },
  })

  return NextResponse.json(updated)
}
