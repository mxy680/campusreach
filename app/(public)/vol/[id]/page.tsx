"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconHeartHandshake,
  IconBuilding,
  IconArrowLeft,
} from "@tabler/icons-react"
import Link from "next/link"
import { HoursLoggedChart } from "@/components/hours-logged-chart"

type VolunteerData = {
  volunteer: {
    id: string
    slug: string | null
    firstName: string
    lastName: string
    name: string | null
    image: string | null
    pronouns: string | null
    school: string | null
    major: string | null
    graduationDate: string | null
    createdAt: string
  }
  stats: {
    totalEvents: number
    totalHours: number
    totalOrganizations: number
    upcomingEvents: number
    totalRatings: number
    averageRating: number | null
  }
  monthlyHours: Array<{
    month: string
    hours: number
  }>
  recentSignups: Array<{
    id: string
    event: {
      id: string
      title: string
      startsAt: string
      location: string
      organization: {
        id: string
        name: string | null
        logoUrl: string | null
      } | null
    }
    createdAt: string
  }>
  recentRatings: Array<{
    id: string
    event: {
      id: string
      title: string
      organization: {
        id: string
        name: string | null
      } | null
    }
    rating: number
    comment: string | null
    createdAt: string
  }>
}

export default function PublicVolunteerProfile() {
  const params = useParams()
  const volunteerId = params.id as string
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VolunteerData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVolunteer() {
      try {
        const response = await fetch(`/api/vol/${volunteerId}`)
        if (!response.ok) {
          if (response.status === 401) {
            setError("Please sign in to view volunteer profiles")
          } else if (response.status === 404) {
            setError("Volunteer not found")
          } else {
            setError("Failed to load volunteer profile")
          }
          return
        }
        const volunteerData = await response.json()
        setData(volunteerData)
      } catch (err) {
        console.error("Error fetching volunteer:", err)
        setError("Failed to load volunteer profile")
      } finally {
        setLoading(false)
      }
    }

    async function fetchUserType() {
      try {
        // Try to fetch org data first
        const orgResponse = await fetch("/api/org/me")
        if (orgResponse.ok) {
          setDashboardUrl("/org")
          return
        }
        // If not org, try volunteer
        const volResponse = await fetch("/api/vol/me")
        if (volResponse.ok) {
          setDashboardUrl("/vol")
          return
        }
      } catch (err) {
        console.error("Error fetching user type:", err)
      }
    }

    if (volunteerId) {
      fetchVolunteer()
      fetchUserType()
    }
  }, [volunteerId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Volunteer Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "The volunteer profile you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { volunteer, stats, recentSignups, monthlyHours } = data

  const displayName = volunteer.name || `${volunteer.firstName} ${volunteer.lastName}`

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const formatHours = (hours: number) => {
    // Round to 2 decimal places to avoid floating point precision issues
    const rounded = Math.round(hours * 100) / 100
    if (rounded === 0) return "0"
    if (rounded < 1) return `${Math.round(rounded * 60)}m`
    const wholeHours = Math.floor(rounded)
    const fractionalPart = rounded - wholeHours
    // Only show minutes if there's a meaningful fractional part (> 0.01 hours = > 0.6 minutes)
    if (fractionalPart < 0.01) return `${wholeHours}h`
    const minutes = Math.round(fractionalPart * 60)
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Go Back Home Section */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Go back home
            </Link>
          </Button>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
              {volunteer.image && (
                <AvatarImage src={volunteer.image} alt={displayName} />
              )}
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {volunteer.firstName.charAt(0)}
                {volunteer.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-bold">{displayName}</h1>
                  {volunteer.pronouns && (
                    <Badge variant="secondary" className="text-xs">
                      {volunteer.pronouns}
                    </Badge>
                  )}
                </div>
                {dashboardUrl && (
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={dashboardUrl} className="flex items-center gap-2">
                      <IconArrowLeft className="h-4 w-4" />
                      Return to Dashboard
                    </Link>
                  </Button>
                )}
              </div>
              <div className="space-y-1 text-muted-foreground">
                {volunteer.school && (
                  <p className="text-lg">{volunteer.school}</p>
                )}
                {volunteer.major && (
                  <p className="text-sm">
                    {volunteer.major}
                    {volunteer.graduationDate && (
                      <span> • Class of {new Date(volunteer.graduationDate).getFullYear()}</span>
                    )}
                  </p>
                )}
                {!volunteer.school && !volunteer.major && (
                  <p className="text-sm">Volunteer since {formatDate(volunteer.createdAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-3">
              <div className="flex items-center gap-2 mb-1">
                <IconHeartHandshake className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
              </div>
              <div className="text-sm text-muted-foreground">Events Joined</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3">
              <div className="flex items-center gap-2 mb-1">
                <IconClock className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{formatHours(stats.totalHours)}</div>
              </div>
              <div className="text-sm text-muted-foreground">Hours Logged</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3">
              <div className="flex items-center gap-2 mb-1">
                <IconBuilding className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              </div>
              <div className="text-sm text-muted-foreground">Organizations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3">
              <div className="flex items-center gap-2 mb-1">
                <IconCalendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
              </div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Events */}
            {recentSignups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                  <CardDescription>
                    Events {displayName} has participated in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSignups.map((signup) => (
                      <div
                        key={signup.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {signup.event.organization?.logoUrl && (
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage
                                src={signup.event.organization.logoUrl}
                                alt={signup.event.organization.name || "Organization"}
                              />
                              <AvatarFallback>
                                {signup.event.organization.name?.[0]?.toUpperCase() || "O"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{signup.event.title}</h3>
                            {signup.event.organization?.name && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {signup.event.organization.name}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <IconCalendar className="h-4 w-4" />
                                <span>{formatDateTime(signup.event.startsAt)}</span>
                              </div>
                              {signup.event.location && signup.event.location !== "TBD" && (
                                <div className="flex items-center gap-1.5">
                                  <IconMapPin className="h-4 w-4" />
                                  <span className="truncate">{signup.event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {recentSignups.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <IconHeartHandshake className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        {displayName} hasn&apos;t participated in any events yet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Impact Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Impact</span>
                  <span className="text-lg font-semibold">
                    {formatHours(stats.totalHours)} hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Events Completed</span>
                  <span className="text-lg font-semibold">{stats.totalEvents}</span>
                </div>
              </CardContent>
            </Card>

            {/* Hours Logged Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hours Logged</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <HoursLoggedChart data={monthlyHours || []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

