import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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

    const body = await request.json()
    const {
      title,
      description,
      dateTime,
      location,
      volunteersNeeded,
      timeCommitment,
      notes,
      skills,
      attachments,
    } = body

    // Validate required fields
    if (!title || !description || !dateTime || !location || !volunteersNeeded) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Parse dateTime (expecting ISO string or datetime-local format)
    const startsAt = new Date(dateTime)
    if (isNaN(startsAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    // Create event with group chat and system announcement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create event
      const event = await tx.event.create({
        data: {
          organizationId: orgMember.organizationId,
          title,
          shortDescription: description,
          startsAt,
          location,
          volunteersNeeded: parseInt(volunteersNeeded, 10),
          timeCommitmentHours: timeCommitment
            ? parseFloat(timeCommitment)
            : null,
          notes: notes || null,
          specialties: skills || [],
          attachments: attachments || [],
        },
      })

      // Create group chat for this event
      const groupChat = await tx.groupChat.create({
        data: {
          eventId: event.id,
        },
      })

      // Create system announcement as first message
      await tx.chatMessage.create({
        data: {
          groupChatId: groupChat.id,
          eventId: event.id,
          authorType: "SYSTEM",
          kind: "ANNOUNCEMENT",
          body: `Welcome to the group chat for "${title}"! This is where volunteers and organizers can communicate about the event.`,
        },
      })

      return event
    })

    return NextResponse.json({ event: result }, { status: 201 })
  } catch (error) {
    console.error("Error creating opportunity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    // Get all events for this organization
    const events = await prisma.event.findMany({
      where: { organizationId: orgMember.organizationId },
      orderBy: { startsAt: "desc" },
      include: {
        signups: {
          select: {
            id: true,
          },
        },
      },
    })

    // Separate into upcoming and past
    const now = new Date()
    const upcoming = events.filter((event) => event.startsAt > now)
    const past = events.filter((event) => event.startsAt <= now)

    return NextResponse.json({
      upcoming,
      past,
    })
  } catch (error) {
    console.error("Error fetching opportunities:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

