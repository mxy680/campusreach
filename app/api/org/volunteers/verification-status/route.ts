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

    // Get all events for this organization
    const organizationEvents = await prisma.event.findMany({
      where: { organizationId: orgMember.organizationId },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
    })

    const eventIds = organizationEvents.map((e) => e.id)

    if (eventIds.length === 0) {
      return NextResponse.json({ unverifiedCount: 0 })
    }

    const now = new Date()

    // Filter to only past events
    const pastEventIds = organizationEvents
      .filter((event) => {
        const eventEndDate = event.endsAt || event.startsAt
        return eventEndDate ? new Date(eventEndDate) < now : false
      })
      .map((e) => e.id)

    if (pastEventIds.length === 0) {
      return NextResponse.json({ unverifiedCount: 0 })
    }

    // Get all signups for past events
    const allSignups = await prisma.eventSignup.findMany({
      where: {
        eventId: {
          in: pastEventIds,
        },
      },
      select: {
        id: true,
        hoursVerified: true,
        eventId: true,
      },
    })

    // Count unverified signups
    const unverifiedCount = allSignups.filter((signup) => !signup.hoursVerified).length

    return NextResponse.json({ unverifiedCount })
  } catch (error) {
    console.error("Error checking verification status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
