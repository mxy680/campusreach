import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Load current organization's settings (name, contactEmail)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Resolve organization by membership first; fallback to email heuristic
  let org = null as null | {
    id: string; name: string | null; email: string | null; contactEmail: string | null;
    timezone: string | null; locale: string | null; defaultEventLocationTemplate: string | null; defaultTimeCommitmentHours: number | null; defaultVolunteersNeeded: number | null;
  }
  const member = await prisma.organizationMember.findFirst({ where: { userId: session.user.id }, select: { organizationId: true } })
  if (member?.organizationId) {
    org = await prisma.organization.findUnique({
      where: { id: member.organizationId },
      select: { id: true, name: true, email: true, contactEmail: true, timezone: true, locale: true, defaultEventLocationTemplate: true, defaultTimeCommitmentHours: true, defaultVolunteersNeeded: true },
    })
  }
  let userEmail: string | null = null
  if (!org) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    userEmail = user?.email ?? null
    if (user?.email) {
      org = await prisma.organization.findFirst({
        where: { email: user.email },
        select: { id: true, name: true, email: true, contactEmail: true, timezone: true, locale: true, defaultEventLocationTemplate: true, defaultTimeCommitmentHours: true, defaultVolunteersNeeded: true },
      })
    }
  } else {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    userEmail = user?.email ?? null
  }
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const envBase = process.env.NEXTAUTH_URL?.trim()
  const reqOrigin = (() => {
    try { return new URL(req.url).origin } catch { return null }
  })()
  const baseUrl = envBase || reqOrigin || null

  return NextResponse.json({
    id: org.id,
    name: org.name ?? "",
    email: org.email ?? "",
    contactEmail: org.contactEmail ?? "",
    timezone: org.timezone ?? null,
    locale: org.locale ?? null,
    defaultEventLocationTemplate: org.defaultEventLocationTemplate ?? null,
    defaultVolunteersNeeded: org.defaultVolunteersNeeded ?? null,
    userEmail: userEmail,
    baseUrl,
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

  // Resolve organization by membership first; fallback to email heuristic
  let orgIdResolved: string | null = null
  const member = await prisma.organizationMember.findFirst({ where: { userId: session.user.id }, select: { organizationId: true } })
  if (member?.organizationId) orgIdResolved = member.organizationId
  if (!orgIdResolved) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    if (user?.email) {
      const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
      orgIdResolved = org?.id ?? null
    }
  }
  if (!orgIdResolved) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const updated = await prisma.organization.update({
    where: { id: orgIdResolved },
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
