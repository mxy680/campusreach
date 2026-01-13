import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, verifyCronSecret } from "@/lib/email"
import { renderWeeklyDigest } from "@/lib/email-templates/weekly-digest"

export async function GET(request: Request) {
  // Verify cron secret in production
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusreach.org"

    // Get volunteers who have weekly digest enabled
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        weeklyDigest: true,
        email: { not: null },
      },
    })

    if (preferences.length === 0) {
      return NextResponse.json({ message: "No subscribers for weekly digest" })
    }

    // Get events created in the last 7 days that are upcoming
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const newEvents = await prisma.event.findMany({
      where: {
        createdAt: { gte: oneWeekAgo },
        startsAt: { gt: new Date() },
      },
      include: {
        organization: {
          select: { name: true },
        },
        _count: {
          select: { signups: true },
        },
      },
      orderBy: { startsAt: "asc" },
      take: 10,
    })

    // Format events for email
    const formattedEvents = newEvents.map((event) => ({
      id: event.id,
      title: event.title,
      organizationName: event.organization?.name || null,
      startsAt: event.startsAt,
      location: event.location,
      volunteersNeeded: event.volunteersNeeded,
      volunteersSignedUp: event._count.signups,
    }))

    // Get volunteer names for personalization
    const userIds = preferences.map((p) => p.userId)
    const volunteers = await prisma.volunteer.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, firstName: true, name: true },
    })

    const volunteerMap = new Map(
      volunteers.map((v) => [v.userId, v.firstName || v.name || "Volunteer"])
    )

    // Send emails
    let sentCount = 0
    let errorCount = 0

    for (const pref of preferences) {
      if (!pref.email) continue

      const volunteerName = volunteerMap.get(pref.userId) || "Volunteer"

      try {
        const html = await renderWeeklyDigest({
          volunteerName,
          events: formattedEvents,
          baseUrl,
        })

        const result = await sendEmail({
          to: pref.email,
          subject:
            newEvents.length > 0
              ? `${newEvents.length} new volunteer opportunities this week`
              : "Your weekly CampusReach update",
          html,
        })

        if (result.success) {
          // Log the sent email
          await prisma.emailLog.create({
            data: {
              userId: pref.userId,
              email: pref.email,
              type: "WEEKLY_DIGEST",
            },
          })
          sentCount++
        } else {
          errorCount++
        }
      } catch (err) {
        console.error(`Failed to send digest to ${pref.email}:`, err)
        errorCount++
      }
    }

    return NextResponse.json({
      message: "Weekly digest completed",
      sent: sentCount,
      errors: errorCount,
      eventsIncluded: newEvents.length,
    })
  } catch (error) {
    console.error("Weekly digest cron error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
