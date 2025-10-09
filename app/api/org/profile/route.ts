import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      slug: true,
      name: true,
      avatarUrl: true,
      logoUrl: true,
      description: true,
      mission: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      categories: true,
      website: true,
      twitter: true,
      instagram: true,
      facebook: true,
      linkedin: true,
      contacts: { select: { id: true, name: true, email: true, phone: true, role: true } },
    },
  })
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  return NextResponse.json({ data: org })
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    orgId?: string
    profile?: {
      name?: string | null
      avatarUrl?: string | null
      logoUrl?: string | null
      description?: string | null
      mission?: string | null
      contactName?: string | null
      contactEmail?: string | null
      contactPhone?: string | null
      categories?: string[] | null
      website?: string | null
      twitter?: string | null
      instagram?: string | null
      facebook?: string | null
      linkedin?: string | null
      contacts?: Array<{ id?: string; name: string; email?: string | null; phone?: string | null; role?: string | null }>
    }
  } | null
  const orgId = body?.orgId
  const profile = body?.profile
  if (!orgId || !profile) return NextResponse.json({ error: "Missing orgId or profile" }, { status: 400 })

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: {
        name: (profile.name ?? undefined)?.toString().trim(),
        avatarUrl: profile.avatarUrl ?? undefined,
        logoUrl: profile.logoUrl ?? undefined,
        description: profile.description ?? undefined,
        mission: profile.mission ?? undefined,
        contactName: profile.contactName ?? undefined,
        contactEmail: profile.contactEmail ?? undefined,
        contactPhone: profile.contactPhone ?? undefined,
        categories: profile.categories ?? undefined,
        website: profile.website ?? undefined,
        twitter: profile.twitter ?? undefined,
        instagram: profile.instagram ?? undefined,
        facebook: profile.facebook ?? undefined,
        linkedin: profile.linkedin ?? undefined,
      },
    })

    if (Array.isArray(profile.contacts)) {
      // Replace contacts
      await tx.organizationContact.deleteMany({ where: { organizationId: orgId } })
      if (profile.contacts.length > 0) {
        await tx.organizationContact.createMany({
          data: profile.contacts.map((c) => ({
            organizationId: orgId,
            name: c.name.trim(),
            email: c.email?.trim() || null,
            phone: c.phone?.trim() || null,
            role: c.role?.trim() || null,
          })),
        })
      }
    }
  })

  return NextResponse.json({ ok: true })
}
