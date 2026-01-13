import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, verifyCronSecret } from "@/lib/email"
import { renderRatingReminder } from "@/lib/email-templates/rating-reminder"

// TEST ENDPOINT - sends rating reminders for ALL unrated past events
// Delete this file before production or keep it protected
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusreach.net"

    // Find ALL past events (not just 24 hours ago)
    const pastEvents = await prisma.event.findMany({
      where: {
        startsAt: { lt: new Date() },
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

    if (pastEvents.length === 0) {
      return NextResponse.json({ message: "No past events found" })
    }

    let sentCount = 0
    let skippedCount = 0
    const details: string[] = []

    for (const event of pastEvents) {
      const ratedVolunteerIds = new Set(event.ratings.map((r) => r.volunteerId))

      for (const signup of event.signups) {
        const volunteer = signup.volunteer

        if (ratedVolunteerIds.has(volunteer.id)) {
          details.push(`${volunteer.email}: already rated "${event.title}"`)
          skippedCount++
          continue
        }

        if (!volunteer.email) {
          details.push(`volunteer ${volunteer.id}: no email`)
          skippedCount++
          continue
        }

        try {
          const volunteerName = volunteer.firstName || volunteer.name || "Volunteer"

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
            details.push(`${volunteer.email}: sent reminder for "${event.title}"`)
            sentCount++
          } else {
            details.push(`${volunteer.email}: failed - ${result.error}`)
          }
        } catch (err) {
          details.push(`${volunteer.email}: error - ${err}`)
        }
      }
    }

    return NextResponse.json({
      message: "Test rating reminders completed",
      sent: sentCount,
      skipped: skippedCount,
      eventsChecked: pastEvents.length,
      details,
    })
  } catch (error) {
    console.error("Test rating reminders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
