import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

export async function GET(request: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const eventId = searchParams.get("eventId")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10)
    const skip = (page - 1) * pageSize

    // Get all events for this organization
    const organizationEvents = await prisma.event.findMany({
      where: { organizationId: orgMember.organizationId },
      select: { 
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
      },
      orderBy: { startsAt: "desc" },
    })

    const eventIds = organizationEvents.map((e) => e.id)

    // Always return events list
    const eventsList = organizationEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
    }))

    // If no eventId is provided, just return events list
    if (!eventId) {
      return NextResponse.json({
        events: eventsList,
        volunteers: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      })
    }

    if (eventIds.length === 0) {
      return NextResponse.json({
        events: eventsList,
        volunteers: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      })
    }

    // If eventId is specified, filter to that event only
    const targetEventIds = [eventId]

    // Build search filter
    const searchFilter: Prisma.VolunteerWhereInput = {}
    if (search) {
      searchFilter.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { major: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get all volunteers who have signed up for events from this organization
    const volunteersWithSignups = await prisma.volunteer.findMany({
      where: {
        ...searchFilter,
        signups: {
          some: {
            eventId: {
              in: targetEventIds,
            },
          },
        },
      },
      include: {
        signups: {
          where: {
            eventId: {
              in: targetEventIds,
            },
          },
          include: {
            event: {
              select: {
                endsAt: true,
                startsAt: true,
                timeCommitmentHours: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1, // Get the earliest signup for this event
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // For each volunteer, get their verified signups across ALL org events to calculate total hours
    const volunteerIds = volunteersWithSignups.map((v) => v.id)
    const allVerifiedSignups = await prisma.eventSignup.findMany({
      where: {
        volunteerId: { in: volunteerIds },
        eventId: { in: eventIds }, // All events for this organization
        hoursVerified: true,
      },
      include: {
        event: {
          select: {
            timeCommitmentHours: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    })

    // Build a map of volunteer ID to total verified hours
    const volunteerTotalHoursMap = new Map<string, number>()
    for (const signup of allVerifiedSignups) {
      const volunteerId = signup.volunteerId
      // Calculate hours from event duration or timeCommitmentHours
      let hours = signup.event.timeCommitmentHours || 0
      if (!hours && signup.event.startsAt && signup.event.endsAt) {
        const durationMs = new Date(signup.event.endsAt).getTime() - new Date(signup.event.startsAt).getTime()
        hours = durationMs / (1000 * 60 * 60) // Convert to hours
      }
      volunteerTotalHoursMap.set(
        volunteerId,
        (volunteerTotalHoursMap.get(volunteerId) || 0) + hours
      )
    }

    // Get the selected event details to check if it's over
    const selectedEvent = eventId
      ? await prisma.event.findUnique({
          where: { id: eventId },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
          },
        })
      : null

    // Calculate total hours and signup date for each volunteer
    const volunteersData = volunteersWithSignups.map((volunteer) => {
      // Get the first (earliest) signup - if filtering by event, this will be for that event
      const relevantSignup = volunteer.signups[0]

      // Total hours from all verified signups across this organization's events
      const totalHours = volunteerTotalHoursMap.get(volunteer.id) || 0

      // Check if event is over (use the selected event's end date, or signup's event end date as fallback)
      const eventEndDate = selectedEvent?.endsAt || selectedEvent?.startsAt || relevantSignup?.event?.endsAt || relevantSignup?.event?.startsAt
      const isEventOver = eventEndDate ? new Date(eventEndDate) < new Date() : false

      return {
        id: volunteer.id,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        name: volunteer.name || `${volunteer.firstName} ${volunteer.lastName}`,
        image: volunteer.image,
        phone: volunteer.phone,
        major: volunteer.major,
        signedUpAt: relevantSignup?.createdAt || null,
        totalHours: totalHours,
        hoursVerified: relevantSignup?.hoursVerified || false,
        isEventOver: isEventOver,
        signupId: relevantSignup?.id || null,
      }
    })

    // Apply pagination
    const total = volunteersData.length
    const paginatedVolunteers = volunteersData.slice(skip, skip + pageSize)
    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      events: eventsList,
      volunteers: paginatedVolunteers,
      total,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    console.error("Error fetching volunteers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const volunteerId = searchParams.get("volunteerId")
    const eventId = searchParams.get("eventId")

    if (!volunteerId) {
      return NextResponse.json(
        { error: "volunteerId is required" },
        { status: 400 }
      )
    }

    // Get all events for this organization
    const organizationEvents = await prisma.event.findMany({
      where: { organizationId: orgMember.organizationId },
      select: { id: true },
    })

    const eventIds = organizationEvents.map((e) => e.id)

    // Delete signups - if eventId is provided, remove from that event only; otherwise remove from all
    const targetEventIds = eventId ? [eventId] : eventIds

    await prisma.eventSignup.deleteMany({
      where: {
        volunteerId,
        eventId: {
          in: targetEventIds,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing volunteer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
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
    const { signupId, hoursVerified } = body

    if (!signupId || typeof hoursVerified !== "boolean") {
      return NextResponse.json(
        { error: "signupId and hoursVerified (boolean) are required" },
        { status: 400 }
      )
    }

    // Verify the signup belongs to an event from this organization
    const signup = await prisma.eventSignup.findUnique({
      where: { id: signupId },
      include: {
        event: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (!signup) {
      return NextResponse.json(
        { error: "Signup not found" },
        { status: 404 }
      )
    }

    if (signup.event.organizationId !== orgMember.organizationId) {
      return NextResponse.json(
        { error: "Not authorized to modify this signup" },
        { status: 403 }
      )
    }

    // Update the hoursVerified status
    const updatedSignup = await prisma.eventSignup.update({
      where: { id: signupId },
      data: { hoursVerified },
    })

    return NextResponse.json({ success: true, hoursVerified: updatedSignup.hoursVerified })
  } catch (error) {
    console.error("Error updating hours verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
