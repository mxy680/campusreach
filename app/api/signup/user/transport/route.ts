import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const { transportMode, radiusMiles, transportNotes } = body as {
    transportMode?: "PROVIDE_OTHERS" | "SELF_ONLY" | "RIDESHARE"
    radiusMiles?: number
    transportNotes?: string
  }

  const volunteer = await prisma.volunteer.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!volunteer) return NextResponse.json({ error: "Volunteer profile not found" }, { status: 404 })

  await prisma.volunteer.update({
    where: { id: volunteer.id },
    data: {
      transportMode: transportMode ?? undefined,
      radiusMiles: typeof radiusMiles === "number" ? radiusMiles : undefined,
      transportNotes: transportNotes ?? undefined,
    },
  })

  return NextResponse.json({ ok: true })
}
