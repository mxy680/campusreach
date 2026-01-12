import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch organization by ID or slug
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
        contacts: {
          orderBy: { createdAt: "asc" },
        },
        events: {
          where: {
            startsAt: {
              gte: new Date(), // Only upcoming events
            },
          },
          orderBy: {
            startsAt: "asc",
          },
          take: 10, // Limit to 10 upcoming events
          include: {
            signups: true,
            _count: {
              select: {
                signups: true,
              },
            },
          },
        },
        _count: {
          select: {
            events: true,
            members: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Calculate stats
    const totalEvents = organization._count.events
    const totalMembers = organization._count.members
    
    // Get total unique volunteers across all events
    const allSignups = await prisma.eventSignup.findMany({
      where: {
        event: {
          organizationId: organization.id,
        },
      },
      select: {
        volunteerId: true,
      },
    })
    const uniqueVolunteers = new Set(allSignups.map((s) => s.volunteerId))
    const totalVolunteers = uniqueVolunteers.size

    // Get all events for monthly chart (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    const allEventsForChart = await prisma.event.findMany({
      where: {
        organizationId: organization.id,
        startsAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        startsAt: true,
      },
      orderBy: {
        startsAt: "asc",
      },
    })

    // Group events by month
    const monthlyCounts: Record<string, number> = {}
    allEventsForChart.forEach((event) => {
      const monthKey = new Date(event.startsAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1
    })

    // Generate last 12 months with counts
    const monthlyEventsData: Array<{ month: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      monthlyEventsData.push({
        month: monthKey,
        count: monthlyCounts[monthKey] || 0,
      })
    }

    // Format response (exclude sensitive data)
    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
        description: organization.description,
        mission: organization.mission,
        categories: organization.categories,
        contactName: organization.contactName,
        contactEmail: organization.contactEmail,
        contactPhone: organization.contactPhone,
        industry: organization.industry,
        twitter: organization.twitter,
        instagram: organization.instagram,
        facebook: organization.facebook,
        linkedin: organization.linkedin,
        contacts: organization.contacts,
        createdAt: organization.createdAt,
      },
      events: organization.events.map((event) => ({
        id: event.id,
        title: event.title,
        shortDescription: event.shortDescription,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        volunteersNeeded: event.volunteersNeeded,
        volunteersSignedUp: event._count.signups,
        timeCommitmentHours: event.timeCommitmentHours,
        specialties: event.specialties,
      })),
      stats: {
        totalEvents,
        totalMembers,
        totalVolunteers,
        upcomingEvents: organization.events.length,
      },
      monthlyEvents: monthlyEventsData,
    })
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

