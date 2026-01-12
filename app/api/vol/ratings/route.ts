import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET: Fetch events that can be rated (past events the volunteer signed up for but hasn't rated yet)
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

    // Get all past events the volunteer signed up for
    const signups = await prisma.eventSignup.findMany({
      where: {
        volunteerId: volunteer.id,
        status: "CONFIRMED",
        event: {
          startsAt: {
            lt: new Date(), // Past events only
          },
        },
      },
      include: {
        event: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          startsAt: "desc",
        },
      },
    })

    // Get existing ratings for these events
    const existingRatings = await prisma.eventRating.findMany({
      where: {
        volunteerId: volunteer.id,
        eventId: {
          in: signups.map((s) => s.eventId),
        },
      },
    })

    const ratedEventIds = new Set(existingRatings.map((r) => r.eventId))

    // Filter to only events that haven't been rated yet
    const eventsToRate = signups
      .filter((signup) => !ratedEventIds.has(signup.eventId))
      .map((signup) => ({
        id: signup.event.id,
        title: signup.event.title,
        startsAt: signup.event.startsAt,
        location: signup.event.location,
        organization: signup.event.organization,
      }))

    return NextResponse.json({ events: eventsToRate })
  } catch (error) {
    console.error("Error fetching events to rate:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Submit a rating for an event
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

    const body = await request.json()
    const { eventId, rating, comment } = body

    if (!eventId || !rating) {
      return NextResponse.json(
        { error: "Event ID and rating are required" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Verify volunteer signed up for this event
    const signup = await prisma.eventSignup.findFirst({
      where: {
        eventId: eventId,
        volunteerId: volunteer.id,
        status: "CONFIRMED",
      },
      include: {
        event: true,
      },
    })

    if (!signup) {
      return NextResponse.json(
        { error: "Event not found or you haven't signed up" },
        { status: 404 }
      )
    }

    // Verify event is in the past
    if (signup.event.startsAt >= new Date()) {
      return NextResponse.json(
        { error: "Cannot rate events that haven't occurred yet" },
        { status: 400 }
      )
    }

    // Create or update rating (upsert)
    const eventRating = await prisma.eventRating.upsert({
      where: {
        eventId_volunteerId: {
          eventId: eventId,
          volunteerId: volunteer.id,
        },
      },
      create: {
        eventId: eventId,
        volunteerId: volunteer.id,
        rating: rating,
        comment: comment || null,
      },
      update: {
        rating: rating,
        comment: comment || null,
      },
    })

    return NextResponse.json({ rating: eventRating })
  } catch (error) {
    console.error("Error submitting rating:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

