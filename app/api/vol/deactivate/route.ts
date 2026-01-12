import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
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

    // Note: We're not actually deleting the volunteer record or user account
    // Instead, we'll mark it as deactivated or handle it according to your business logic
    // For now, we'll just delete the volunteer record and related data
    // In a production app, you might want to:
    // 1. Add a `deactivatedAt` field to mark accounts as deactivated
    // 2. Soft delete instead of hard delete
    // 3. Keep some data for legal/compliance reasons

    // Delete related data (cascades should handle most of this)
    // But we'll explicitly handle some relations
    await prisma.eventSignup.deleteMany({
      where: { volunteerId: volunteer.id },
    })

    await prisma.timeEntry.deleteMany({
      where: { volunteerId: volunteer.id },
    })

    await prisma.eventRating.deleteMany({
      where: { volunteerId: volunteer.id },
    })

    // Delete notification preferences
    await prisma.notificationPreference.deleteMany({
      where: { userId: user.id },
    })

    // Delete volunteer record
    await prisma.volunteer.delete({
      where: { id: volunteer.id },
    })

    // Sign out the user
    await supabase.auth.signOut()

    return NextResponse.json({ message: "Account deactivated successfully" })
  } catch (error) {
    console.error("Error deactivating account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

