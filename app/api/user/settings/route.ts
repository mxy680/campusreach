import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET settings for the current authenticated user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const notif = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
    select: { emailUpdates: true, pushEnabled: true, weeklyDigest: true },
  })

  return NextResponse.json({
    user: { name: user.name ?? "", email: user.email },
    notifications: notif ?? { emailUpdates: true, pushEnabled: false, weeklyDigest: true },
  })
}

// PUT settings (name/email + notification prefs) for current user
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  const { name, newEmail, notifications } = body as {
    name?: string
    newEmail?: string
    notifications?: { emailUpdates: boolean; pushEnabled: boolean; weeklyDigest: boolean }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (name !== undefined || newEmail !== undefined) {
    await prisma.user.update({ where: { id: user.id }, data: { name: name ?? undefined, email: newEmail ?? undefined } })
  }

  if (notifications) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: notifications,
      create: { userId: user.id, ...notifications },
    })
  }

  return NextResponse.json({ ok: true })
}
