import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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

    // Verify user is a volunteer
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
    })

    if (!volunteer) {
      return NextResponse.json(
        { error: "Not a volunteer" },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const timeCommitment = searchParams.get("timeCommitment")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const specialty = searchParams.get("specialty")
    const orgType = searchParams.get("orgType")

    // Build where clause
    const startsAtFilter: {
      gte?: Date
      lte?: Date
    } = {
      // Only show upcoming events
      gte: new Date(),
    }

    // Date range filters
    if (fromDate) {
      const from = new Date(fromDate)
      if (!isNaN(from.getTime())) {
        startsAtFilter.gte = from
      }
    }

    if (toDate) {
      const to = new Date(toDate)
      if (!isNaN(to.getTime())) {
        // Set to end of day
        to.setHours(23, 59, 59, 999)
        startsAtFilter.lte = to
      }
    }

    // Use a more flexible type that matches Prisma's where clause structure
    const where: Record<string, unknown> = {
      startsAt: startsAtFilter,
    }

    // Search filter (title, description, organization name)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        {
          organization: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ]
    }

    // Time commitment filter
    if (timeCommitment && timeCommitment !== "Any") {
      const hours = parseFloat(timeCommitment)
      if (!isNaN(hours)) {
        where.timeCommitmentHours = hours
      }
    }

    // Specialty filter
    if (specialty && specialty !== "Any") {
      where.specialties = {
        has: specialty,
      }
    }

    // Organization type filter
    if (orgType && orgType !== "Any") {
      where.organization = {
        type: orgType,
      }
    }

    // Get all events matching filters
    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            type: true,
          },
        },
        signups: {
          select: {
            id: true,
            volunteerId: true,
          },
        },
      },
    })

    // Check which events the volunteer has already signed up for
    const volunteerSignups = await prisma.eventSignup.findMany({
      where: {
        volunteerId: volunteer.id,
        eventId: {
          in: events.map((e) => e.id),
        },
      },
      select: {
        eventId: true,
        status: true,
      },
    })

    const signupMap = new Map(
      volunteerSignups.map((s) => [s.eventId, s.status])
    )

    // Add signup status to each event
    const eventsWithSignupStatus = events.map((event) => ({
      ...event,
      hasSignedUp: signupMap.has(event.id),
      signupStatus: signupMap.get(event.id) || null,
      spotsRemaining: event.volunteersNeeded - event.signups.length,
    }))

    return NextResponse.json({
      opportunities: eventsWithSignupStatus,
    })
  } catch (error) {
    console.error("Error fetching opportunities:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

