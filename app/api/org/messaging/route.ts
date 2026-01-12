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

    // Get organization member record
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
    })

    if (!orgMember) {
      return NextResponse.json(
        { error: "Not an organization member" },
        { status: 403 }
      )
    }

    // Get all events for this organization with their group chats
    // Only include events that haven't finished yet (startsAt is in the future)
    const now = new Date()
    const events = await prisma.event.findMany({
      where: { 
        organizationId: orgMember.organizationId,
        startsAt: {
          gte: now, // Only events that haven't started yet
        },
      },
      orderBy: { startsAt: "asc" }, // Show upcoming events first
      include: {
        groupChat: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1, // Get the last message for preview
            },
          },
        },
        signups: {
          select: {
            id: true,
          },
        },
      },
    })

    // Format events with chat info
    const eventsWithChats = await Promise.all(
      events.map(async (event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        location: event.location,
        groupChatId: event.groupChat?.id || null,
        lastMessage: event.groupChat?.messages[0] || null,
        messageCount: event.groupChat
          ? await prisma.chatMessage.count({
              where: { groupChatId: event.groupChat.id },
            })
          : 0,
        signupCount: event.signups.length,
      }))
    )

    return NextResponse.json({ events: eventsWithChats })
  } catch (error) {
    console.error("Error fetching messaging events:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

