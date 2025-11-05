import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Load volunteer profile for the current authenticated user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      volunteer: {
        select: {
          slug: true,
          id: true,
          firstName: true,
          lastName: true,
          school: true,
          major: true,
          graduationDate: true,
          phone: true,
          transportMode: true,
          radiusMiles: true,
          transportNotes: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const v = user.volunteer
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    profile: v
      ? {
          slug: v.slug ?? null,
          firstName: v.firstName,
          lastName: v.lastName,
          school: v.school ?? "",
          major: v.major ?? "",
          gradYear: v.graduationDate ? String(new Date(v.graduationDate).getFullYear()) : "",
          phone: v.phone ?? "",
          transportMode: v.transportMode,
          radiusMiles: v.radiusMiles,
          transportNotes: v.transportNotes ?? "",
        }
      : null,
  })
}

// Create/update volunteer profile for the current authenticated user
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  const { profile } = body as {
    profile?: {
      firstName: string
      lastName: string
      school?: string
      major?: string
      gradYear?: string
      phone?: string
      transportMode: "PROVIDE_OTHERS" | "SELF_ONLY" | "RIDESHARE"
      radiusMiles: number
      transportNotes?: string
    }
  }
  if (!profile) return NextResponse.json({ error: "Missing profile" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, volunteer: { select: { id: true, slug: true } } } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const gradYearNum = profile.gradYear ? Number(profile.gradYear) : undefined
  const graduationDate = gradYearNum && !Number.isNaN(gradYearNum) ? new Date(`${gradYearNum}-06-01T00:00:00.000Z`) : null

  const data = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    school: profile.school || null,
    major: profile.major || null,
    graduationDate: graduationDate,
    phone: profile.phone || null,
    transportMode: profile.transportMode,
    radiusMiles: Math.max(1, Math.min(100, Number(profile.radiusMiles) || 10)),
    transportNotes: profile.transportNotes || null,
  }

  // Generate a stable 16-char slug from user id if missing
  const stableSlug = crypto.createHash("sha256").update(user.id).digest("hex").slice(0, 16)

  const result = await prisma.volunteer.upsert({
    where: { userId: user.id },
    update: {
      ...data,
      // only set slug if it's currently null
      slug: user.volunteer?.slug ? undefined : stableSlug,
    },
    create: { userId: user.id, slug: stableSlug, ...data },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: result.id })
}
