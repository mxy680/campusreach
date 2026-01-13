import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Require authentication but allow any authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params instanceof Promise ? await params : params

    // Fetch volunteer by ID or slug
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
        signups: {
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
            createdAt: "desc",
          },
          take: 10, // Limit to 10 recent signups
        },
        ratings: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Limit to 5 recent ratings
        },
        _count: {
          select: {
            signups: true,
            ratings: true,
          },
        },
      },
    })

    if (!volunteer) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 }
      )
    }

    // Get all verified signups to calculate total hours
    const verifiedSignups = await prisma.eventSignup.findMany({
      where: {
        volunteerId: volunteer.id,
        hoursVerified: true,
      },
      include: {
        event: {
          select: {
            id: true,
            timeCommitmentHours: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    })

    // Calculate total hours from verified signups
    const totalHours = verifiedSignups.reduce((sum, signup) => {
      let hours = signup.event.timeCommitmentHours || 0
      if (!hours && signup.event.startsAt && signup.event.endsAt) {
        const durationMs = new Date(signup.event.endsAt).getTime() - new Date(signup.event.startsAt).getTime()
        hours = durationMs / (1000 * 60 * 60) // Convert to hours
      }
      return sum + hours
    }, 0)

    // Get verified signups from the last 6 months for monthly chart
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlySignups = await prisma.eventSignup.findMany({
      where: {
        volunteerId: volunteer.id,
        hoursVerified: true,
        event: {
          startsAt: {
            gte: sixMonthsAgo,
          },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            startsAt: true,
            timeCommitmentHours: true,
            endsAt: true,
          },
        },
      },
    })

    // Group by month
    const hoursByMonth: Record<string, number> = {}
    monthlySignups.forEach((signup) => {
      let hours = signup.event.timeCommitmentHours || 0
      if (!hours && signup.event.startsAt && signup.event.endsAt) {
        const durationMs = new Date(signup.event.endsAt).getTime() - new Date(signup.event.startsAt).getTime()
        hours = durationMs / (1000 * 60 * 60)
      }
      const eventDate = new Date(signup.event.startsAt)
      const monthKey = eventDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      if (!hoursByMonth[monthKey]) {
        hoursByMonth[monthKey] = 0
      }
      hoursByMonth[monthKey] += hours
    })

    // Generate last 6 months with data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyHoursData: Array<{ month: string; hours: number }> = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
      monthlyHoursData.push({
        month: monthKey,
        hours: hoursByMonth[monthKey] || 0,
      })
    }

    // Get unique organizations volunteered with
    const organizationIds = new Set<string>()
    volunteer.signups.forEach((signup) => {
      if (signup.event.organization?.id) {
        organizationIds.add(signup.event.organization.id)
      }
    })

    // Get upcoming events they're signed up for
    const upcomingSignups = volunteer.signups.filter(
      (signup) => new Date(signup.event.startsAt) >= new Date()
    )

    // Calculate average rating given
    const avgRatingResult = await prisma.eventRating.aggregate({
      where: {
        volunteerId: volunteer.id,
      },
      _avg: {
        rating: true,
      },
    })
    const averageRating = avgRatingResult._avg.rating || null

    // Format response (exclude sensitive data like email, phone, userId)
    return NextResponse.json({
      volunteer: {
        id: volunteer.id,
        slug: volunteer.slug,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        name: volunteer.name,
        image: volunteer.image,
        pronouns: volunteer.pronouns,
        school: volunteer.school,
        major: volunteer.major,
        graduationDate: volunteer.graduationDate,
        createdAt: volunteer.createdAt,
      },
      stats: {
        totalEvents: volunteer._count.signups,
        totalHours: totalHours,
        totalOrganizations: organizationIds.size,
        upcomingEvents: upcomingSignups.length,
        totalRatings: volunteer._count.ratings,
        averageRating: averageRating,
      },
      monthlyHours: monthlyHoursData,
      recentSignups: volunteer.signups.map((signup) => ({
        id: signup.id,
        event: {
          id: signup.event.id,
          title: signup.event.title,
          startsAt: signup.event.startsAt,
          location: signup.event.location,
          organization: signup.event.organization,
        },
        createdAt: signup.createdAt,
      })),
      recentRatings: volunteer.ratings.map((rating) => ({
        id: rating.id,
        event: {
          id: rating.event.id,
          title: rating.event.title,
          organization: rating.event.organization,
        },
        rating: rating.rating,
        comment: rating.comment,
        createdAt: rating.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching volunteer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
