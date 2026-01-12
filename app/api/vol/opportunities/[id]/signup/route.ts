import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: eventId } = await params

    // Check if event exists and is upcoming
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        signups: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      )
    }

    // Check if event is in the past
    if (event.startsAt < new Date()) {
      return NextResponse.json(
        { error: "Cannot sign up for past opportunities" },
        { status: 400 }
      )
    }

    // Check if already signed up
    const existingSignup = await prisma.eventSignup.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId: volunteer.id,
        },
      },
    })

    if (existingSignup) {
      return NextResponse.json(
        { error: "Already signed up for this opportunity" },
        { status: 400 }
      )
    }

    // Check if event is full
    if (event.signups.length >= event.volunteersNeeded) {
      return NextResponse.json(
        { error: "This opportunity is full" },
        { status: 400 }
      )
    }

    // Create signup
    const signup = await prisma.eventSignup.create({
      data: {
        eventId,
        volunteerId: volunteer.id,
        status: "CONFIRMED",
      },
    })

    return NextResponse.json({ signup }, { status: 201 })
  } catch (error: unknown) {
    console.error("Error signing up for opportunity:", error)
    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      // Unique constraint violation (already signed up)
      return NextResponse.json(
        { error: "Already signed up for this opportunity" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: eventId } = await params

    // Check if signup exists
    const existingSignup = await prisma.eventSignup.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId: volunteer.id,
        },
      },
    })

    if (!existingSignup) {
      return NextResponse.json(
        { error: "Not signed up for this opportunity" },
        { status: 404 }
      )
    }

    // Delete signup
    await prisma.eventSignup.delete({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId: volunteer.id,
        },
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    console.error("Error unregistering from opportunity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

