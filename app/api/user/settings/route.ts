import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET settings for a user by email
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email },
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

// PUT settings (name/email + notification prefs)
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  const { email, name, newEmail, notifications } = body as {
    email?: string
    name?: string
    newEmail?: string
    notifications?: { emailUpdates: boolean; pushEnabled: boolean; weeklyDigest: boolean }
  }
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
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
