import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
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

    // Fetch event with full details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            logoUrl: true,
            description: true,
            contactEmail: true,
            contactPhone: true,
            categories: true,
            twitter: true,
            instagram: true,
            facebook: true,
            linkedin: true,
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

    if (!event) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      )
    }

    // Check if volunteer has signed up
    const volunteerSignup = await prisma.eventSignup.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId: volunteer.id,
        },
      },
      select: {
        status: true,
      },
    })

    // Calculate spots remaining
    const spotsRemaining = event.volunteersNeeded - event.signups.length

    return NextResponse.json({
      opportunity: {
        ...event,
        hasSignedUp: !!volunteerSignup,
        signupStatus: volunteerSignup?.status || null,
        spotsRemaining,
      },
    })
  } catch (error) {
    console.error("Error fetching opportunity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
