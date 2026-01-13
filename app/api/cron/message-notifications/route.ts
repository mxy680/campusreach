import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, verifyCronSecret } from "@/lib/email"
import { renderMessageNotification } from "@/lib/email-templates/message-notification"

export async function GET(request: Request) {
  // Verify cron secret in production
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://campusreach.org"

    // Get unprocessed notification queue entries
    const queueEntries = await prisma.messageNotificationQueue.findMany({
      where: {
        processedAt: null,
      },
    })

    if (queueEntries.length === 0) {
      return NextResponse.json({ message: "No pending notifications" })
    }

    let sentCount = 0
    let errorCount = 0

    for (const entry of queueEntries) {
      try {
        // Check user notification preferences
        const preference = await prisma.notificationPreference.findUnique({
          where: { userId: entry.userId },
        })

        // Default to sending if no preference set, otherwise check emailUpdates
        if (preference && !preference.emailUpdates) {
          // Mark as processed but don't send
          await prisma.messageNotificationQueue.update({
            where: { id: entry.id },
            data: { processedAt: new Date() },
          })
          continue
        }

        // Get event info
        const event = await prisma.event.findUnique({
          where: { id: entry.eventId },
          select: { id: true, title: true },
        })

        if (!event) {
          await prisma.messageNotificationQueue.update({
            where: { id: entry.id },
            data: { processedAt: new Date() },
          })
          continue
        }

        // Get user email - check volunteer first, then org member
        let userEmail: string | null = null
        let userName = "Volunteer"

        const volunteer = await prisma.volunteer.findUnique({
          where: { userId: entry.userId },
          select: { email: true, firstName: true, name: true },
        })

        if (volunteer) {
          userEmail = volunteer.email
          userName = volunteer.firstName || volunteer.name || "Volunteer"
        } else {
          const orgMember = await prisma.organizationMember.findFirst({
            where: { userId: entry.userId },
            select: { email: true, name: true },
          })
          if (orgMember) {
            userEmail = orgMember.email
            userName = orgMember.name || "Team Member"
          }
        }

        if (!userEmail) {
          // No email found, mark as processed
          await prisma.messageNotificationQueue.update({
            where: { id: entry.id },
            data: { processedAt: new Date() },
          })
          continue
        }

        // Render and send email
        const html = await renderMessageNotification({
          recipientName: userName,
          eventTitle: event.title,
          messageCount: entry.messageIds.length,
          eventId: event.id,
          baseUrl,
        })

        const result = await sendEmail({
          to: userEmail,
          subject: `${entry.messageIds.length} new message${entry.messageIds.length !== 1 ? "s" : ""} in ${event.title}`,
          html,
        })

        // Mark as processed
        await prisma.messageNotificationQueue.update({
          where: { id: entry.id },
          data: { processedAt: new Date() },
        })

        if (result.success) {
          // Log the sent email
          await prisma.emailLog.create({
            data: {
              userId: entry.userId,
              email: userEmail,
              type: "MESSAGE_NOTIFICATION",
              referenceId: entry.eventId,
            },
          })
          sentCount++
        } else {
          errorCount++
        }
      } catch (err) {
        console.error(`Failed to process notification ${entry.id}:`, err)
        errorCount++

        // Mark as processed to avoid infinite retries
        await prisma.messageNotificationQueue.update({
          where: { id: entry.id },
          data: { processedAt: new Date() },
        })
      }
    }

    return NextResponse.json({
      message: "Message notifications processed",
      sent: sentCount,
      errors: errorCount,
      total: queueEntries.length,
    })
  } catch (error) {
    console.error("Message notifications cron error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
