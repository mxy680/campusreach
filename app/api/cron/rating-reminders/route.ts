import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, verifyCronSecret } from "@/lib/email"
import { renderRatingReminder } from "@/lib/email-templates/rating-reminder"

export async function GET(request: Request) {
  // Verify cron secret in production
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusreach.org"

    // Find events that ended approximately 24 hours ago (23-25 hour window)
    const now = new Date()
    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000)
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000)

    const recentlyEndedEvents = await prisma.event.findMany({
      where: {
        // Use endsAt if available, otherwise startsAt
        OR: [
          {
            endsAt: {
              gte: twentyFiveHoursAgo,
              lte: twentyThreeHoursAgo,
            },
          },
          {
            endsAt: null,
            startsAt: {
              gte: twentyFiveHoursAgo,
              lte: twentyThreeHoursAgo,
            },
          },
        ],
      },
      include: {
        organization: {
          select: { name: true },
        },
        signups: {
          where: { status: "CONFIRMED" },
          include: {
            volunteer: {
              select: {
                id: true,
                userId: true,
                email: true,
                firstName: true,
                name: true,
              },
            },
          },
        },
        ratings: {
          select: { volunteerId: true },
        },
      },
    })

    if (recentlyEndedEvents.length === 0) {
      return NextResponse.json({ message: "No events to send reminders for" })
    }

    let sentCount = 0
    let errorCount = 0
    let skippedCount = 0

    for (const event of recentlyEndedEvents) {
      // Get volunteers who signed up but haven't rated
      const ratedVolunteerIds = new Set(event.ratings.map((r) => r.volunteerId))

      for (const signup of event.signups) {
        const volunteer = signup.volunteer

        // Skip if already rated
        if (ratedVolunteerIds.has(volunteer.id)) {
          skippedCount++
          continue
        }

        // Skip if no email
        if (!volunteer.email) {
          skippedCount++
          continue
        }

        // Check if we already sent a reminder for this event
        const existingLog = await prisma.emailLog.findFirst({
          where: {
            userId: volunteer.userId,
            type: "RATING_REMINDER",
            referenceId: event.id,
          },
        })

        if (existingLog) {
          skippedCount++
          continue
        }

        // Check user notification preferences
        const preference = await prisma.notificationPreference.findUnique({
          where: { userId: volunteer.userId },
        })

        // Default to sending if no preference set, otherwise check emailUpdates
        if (preference && !preference.emailUpdates) {
          skippedCount++
          continue
        }

        try {
          const volunteerName =
            volunteer.firstName || volunteer.name || "Volunteer"

          const html = await renderRatingReminder({
            volunteerName,
            eventTitle: event.title,
            organizationName: event.organization?.name || null,
            baseUrl,
          })

          const result = await sendEmail({
            to: volunteer.email,
            subject: `How was ${event.title}?`,
            html,
          })

          if (result.success) {
            // Log the sent email
            await prisma.emailLog.create({
              data: {
                userId: volunteer.userId,
                email: volunteer.email,
                type: "RATING_REMINDER",
                referenceId: event.id,
              },
            })
            sentCount++
          } else {
            errorCount++
          }
        } catch (err) {
          console.error(
            `Failed to send rating reminder to ${volunteer.email}:`,
            err
          )
          errorCount++
        }
      }
    }

    return NextResponse.json({
      message: "Rating reminders completed",
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
      eventsProcessed: recentlyEndedEvents.length,
    })
  } catch (error) {
    console.error("Rating reminders cron error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
