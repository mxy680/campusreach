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
      include: {
        signups: {
          include: {
            event: {
              include: {
                organization: true,
              },
            },
          },
        },
        ratings: {
          include: {
            event: true,
          },
        },
      },
    })

    if (!volunteer) {
      return NextResponse.json({ error: "Not a volunteer" }, { status: 403 })
    }

    // Get notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    })

    // Compile export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
      },
      volunteer: {
        id: volunteer.id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        name: volunteer.name,
        email: volunteer.email,
        school: volunteer.school,
        major: volunteer.major,
        graduationDate: volunteer.graduationDate,
        phone: volunteer.phone,
        transportMode: volunteer.transportMode,
        radiusMiles: volunteer.radiusMiles,
        weeklyGoalHours: volunteer.weeklyGoalHours,
        createdAt: volunteer.createdAt,
        updatedAt: volunteer.updatedAt,
      },
      notificationPreferences: preferences
        ? {
            emailUpdates: preferences.emailUpdates,
            pushEnabled: preferences.pushEnabled,
            weeklyDigest: preferences.weeklyDigest,
          }
        : null,
      signups: volunteer.signups.map((signup) => ({
        id: signup.id,
        eventId: signup.eventId,
        eventTitle: signup.event.title,
        organizationName: signup.event.organization?.name,
        status: signup.status,
        hoursVerified: signup.hoursVerified,
        createdAt: signup.createdAt,
        updatedAt: signup.updatedAt,
      })),
      ratings: volunteer.ratings.map((rating) => ({
        id: rating.id,
        eventId: rating.eventId,
        eventTitle: rating.event.title,
        rating: rating.rating,
        comment: rating.comment,
        createdAt: rating.createdAt,
      })),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

