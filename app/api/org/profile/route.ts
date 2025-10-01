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
      name: true,
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
    },
  })
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  return NextResponse.json({ data: org })
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    orgId?: string
    profile?: {
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
    }
  } | null
  const orgId = body?.orgId
  const profile = body?.profile
  if (!orgId || !profile) return NextResponse.json({ error: "Missing orgId or profile" }, { status: 400 })

  await prisma.organization.update({
    where: { id: orgId },
    data: {
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

  return NextResponse.json({ ok: true })
}
