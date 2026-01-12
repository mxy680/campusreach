import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> | { eventId: string } }
) {
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

    // Handle both Promise and direct params (for Next.js 14 and 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const eventId = resolvedParams.eventId

    // Verify event belongs to organization
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId: orgMember.organizationId,
      },
      include: {
        groupChat: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Ensure group chat exists (create if it doesn't)
    let groupChat = event.groupChat
    if (!groupChat) {
      groupChat = await prisma.groupChat.create({
        data: {
          eventId: event.id,
        },
      })

      // Create system announcement if chat was just created
      await prisma.chatMessage.create({
        data: {
          groupChatId: groupChat.id,
          eventId: event.id,
          authorType: "SYSTEM",
          kind: "ANNOUNCEMENT",
          body: `Welcome to the group chat for "${event.title}"! This is where volunteers and organizers can communicate about the event.`,
        },
      })
    }

    // Get all messages for this chat with user info
    // Double-check by filtering by both groupChatId and eventId to ensure correctness
    const messages = await prisma.chatMessage.findMany({
      where: {
        groupChatId: groupChat.id,
        eventId: event.id, // Additional safety check
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Enrich messages with user/org info
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.authorType === "SYSTEM" || !message.userId) {
          return {
            ...message,
            user: null,
            organization: null,
          }
        }

        // Check if it's a volunteer
        const volunteer = await prisma.volunteer.findUnique({
          where: { userId: message.userId },
          select: {
            id: true,
            name: true,
            image: true,
            firstName: true,
            lastName: true,
          },
        })

        if (volunteer) {
          return {
            ...message,
            user: {
              id: volunteer.id,
              name: volunteer.name || `${volunteer.firstName} ${volunteer.lastName}`,
              image: volunteer.image,
            },
            organization: null,
          }
        }

        // Check if it's an organization member
        const orgMember = await prisma.organizationMember.findFirst({
          where: { userId: message.userId },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        })

        if (orgMember) {
          return {
            ...message,
            user: {
              id: orgMember.userId,
              name: orgMember.name || orgMember.organization.name || "Unknown",
              image: orgMember.logoUrl || orgMember.organization.logoUrl || null,
            },
            organization: {
              id: orgMember.organization.id,
              name: orgMember.organization.name,
              logoUrl: orgMember.organization.logoUrl || orgMember.logoUrl,
            },
          }
        }

        return {
          ...message,
          user: null,
          organization: null,
        }
      })
    )

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        location: event.location,
      },
      messages: enrichedMessages,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> | { eventId: string } }
) {
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

    // Handle both Promise and direct params (for Next.js 14 and 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const eventId = resolvedParams.eventId
    const body = await request.json()
    const { message, isAnnouncement } = body

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Verify event belongs to organization
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId: orgMember.organizationId,
      },
      include: {
        groupChat: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Ensure group chat exists
    let groupChat = event.groupChat
    if (!groupChat) {
      groupChat = await prisma.groupChat.create({
        data: {
          eventId: event.id,
        },
      })

      // Create system announcement if chat was just created
      await prisma.chatMessage.create({
        data: {
          groupChatId: groupChat.id,
          eventId: event.id,
          authorType: "SYSTEM",
          kind: "ANNOUNCEMENT",
          body: `Welcome to the group chat for "${event.title}"! This is where volunteers and organizers can communicate about the event.`,
        },
      })
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        groupChatId: groupChat.id,
        eventId: event.id,
        userId: user.id,
        authorType: "USER",
        kind: isAnnouncement ? "ANNOUNCEMENT" : "MESSAGE",
        body: message.trim(),
      },
    })

    // Get organization member info for the response
    const orgMemberWithOrg = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    })

    const enrichedMessage = {
      ...chatMessage,
      user: orgMemberWithOrg
        ? {
            id: orgMemberWithOrg.userId,
            name: orgMemberWithOrg.name || orgMemberWithOrg.organization.name || "Unknown",
            image: orgMemberWithOrg.logoUrl || orgMemberWithOrg.organization.logoUrl || null,
          }
        : null,
      organization: orgMemberWithOrg
        ? {
            id: orgMemberWithOrg.organization.id,
            name: orgMemberWithOrg.organization.name,
            logoUrl: orgMemberWithOrg.organization.logoUrl || orgMemberWithOrg.logoUrl,
          }
        : null,
    }

    return NextResponse.json({ message: enrichedMessage }, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

