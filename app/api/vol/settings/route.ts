import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get volunteer record
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
    })

    if (!volunteer) {
      return NextResponse.json({ error: "Not a volunteer" }, { status: 403 })
    }

    // Get or create notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          email: user.email || null,
          emailUpdates: true,
          pushEnabled: false,
          weeklyDigest: true,
        },
      })
    }

    return NextResponse.json({
      emailUpdates: preferences.emailUpdates,
      pushEnabled: preferences.pushEnabled,
      weeklyDigest: preferences.weeklyDigest,
    })
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get volunteer record
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
    })

    if (!volunteer) {
      return NextResponse.json({ error: "Not a volunteer" }, { status: 403 })
    }

    const body = await request.json()
    const { emailUpdates, pushEnabled, weeklyDigest } = body

    // Update or create notification preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        email: user.email || null,
        emailUpdates: emailUpdates !== undefined ? emailUpdates : undefined,
        pushEnabled: pushEnabled !== undefined ? pushEnabled : undefined,
        weeklyDigest: weeklyDigest !== undefined ? weeklyDigest : undefined,
      },
      create: {
        userId: user.id,
        email: user.email || null,
        emailUpdates: emailUpdates ?? true,
        pushEnabled: pushEnabled ?? false,
        weeklyDigest: weeklyDigest ?? true,
      },
    })

    return NextResponse.json({
      emailUpdates: preferences.emailUpdates,
      pushEnabled: preferences.pushEnabled,
      weeklyDigest: preferences.weeklyDigest,
    })
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

