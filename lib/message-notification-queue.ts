import { prisma } from "@/lib/prisma"

/**
 * Queue a message notification for all participants in an event chat
 * except the sender. Notifications are batched and sent every 15 minutes.
 */
export async function queueMessageNotification(
  eventId: string,
  messageId: string,
  senderUserId: string
) {
  try {
    // Get all participants: volunteers who signed up + org members
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        signups: {
          where: { status: "CONFIRMED" },
          include: {
            volunteer: {
              select: { userId: true },
            },
          },
        },
        organization: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!event) return

    // Collect all participant userIds except sender
    const participantUserIds = new Set<string>()

    // Add volunteers
    for (const signup of event.signups) {
      if (signup.volunteer.userId !== senderUserId) {
        participantUserIds.add(signup.volunteer.userId)
      }
    }

    // Add org members
    if (event.organization) {
      for (const member of event.organization.members) {
        if (member.userId !== senderUserId) {
          participantUserIds.add(member.userId)
        }
      }
    }

    // Queue notifications for each participant
    for (const userId of participantUserIds) {
      // Upsert to add messageId to existing queue or create new
      await prisma.messageNotificationQueue.upsert({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        update: {
          messageIds: {
            push: messageId,
          },
        },
        create: {
          userId,
          eventId,
          messageIds: [messageId],
        },
      })
    }
  } catch (error) {
    // Log but don't throw - notifications are non-critical
    console.error("Failed to queue message notification:", error)
  }
}
