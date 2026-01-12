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
      return NextResponse.json(
        { error: "Not a volunteer" },
        { status: 403 }
      )
    }

    // Get all events the volunteer has signed up for
    // Only include events that haven't finished yet (startsAt is in the future)
    const now = new Date()
    const signups = await prisma.eventSignup.findMany({
      where: {
        volunteerId: volunteer.id,
        status: "CONFIRMED",
        event: {
          startsAt: {
            gte: now, // Only events that haven't started yet
          },
        },
      },
      include: {
        event: {
          include: {
            groupChat: {
              include: {
                messages: {
                  orderBy: { createdAt: "desc" },
                  take: 1, // Get the last message for preview
                },
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
            signups: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Format events with chat info
    const eventsWithChats = await Promise.all(
      signups.map(async (signup) => {
        const event = signup.event
        return {
          id: event.id,
          title: event.title,
          startsAt: event.startsAt,
          location: event.location,
          organization: event.organization,
          groupChatId: event.groupChat?.id || null,
          lastMessage: event.groupChat?.messages[0] || null,
          messageCount: event.groupChat
            ? await prisma.chatMessage.count({
                where: { groupChatId: event.groupChat.id },
              })
            : 0,
          signupCount: event.signups.length,
        }
      })
    )

    // Sort by startsAt (upcoming events first)
    eventsWithChats.sort((a, b) => {
      const dateA = new Date(a.startsAt).getTime()
      const dateB = new Date(b.startsAt).getTime()
      return dateA - dateB
    })

    return NextResponse.json({ events: eventsWithChats })
  } catch (error) {
    console.error("Error fetching messaging events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

