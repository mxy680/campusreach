"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { IconMapPin, IconClock, IconUsers, IconCalendar, IconMail, IconPhone, IconBrandTwitter, IconBrandInstagram, IconBrandFacebook, IconBrandLinkedin, IconExternalLink, IconInfoCircle, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { EventsPerMonthChart } from "@/components/events-per-month-chart"

type OrganizationData = {
  organization: {
    id: string
    name: string | null
    slug: string | null
    logoUrl: string | null
    description: string | null
    mission: string | null
    categories: string[]
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    industry: string | null
    twitter: string | null
    instagram: string | null
    facebook: string | null
    linkedin: string | null
    contacts: Array<{
      id: string
      name: string
      email: string | null
      phone: string | null
      role: string | null
    }>
    createdAt: string
  }
  events: Array<{
    id: string
    title: string
    shortDescription: string | null
    startsAt: string
    endsAt: string | null
    location: string
    volunteersNeeded: number
    volunteersSignedUp: number
    timeCommitmentHours: number | null
    specialties: string[]
  }>
  stats: {
    totalEvents: number
    totalMembers: number
    totalVolunteers: number
    upcomingEvents: number
  }
  monthlyEvents: Array<{
    month: string
    count: number
  }>
}

export default function PublicOrganizationProfile() {
  const params = useParams()
  const orgId = params.id as string
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OrganizationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch(`/api/org/${orgId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError("Organization not found")
          } else {
            setError("Failed to load organization")
          }
          return
        }
        const orgData = await response.json()
        setData(orgData)
      } catch (err) {
        console.error("Error fetching organization:", err)
        setError("Failed to load organization")
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
    }
  }, [orgId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Organization Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || "The organization you're looking for doesn't exist."}</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { organization, events, stats, monthlyEvents } = data

  const formatDate = (dateString: string) => {
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
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
              <AvatarImage src={organization.logoUrl || undefined} alt={organization.name || "Organization"} />
              <AvatarFallback className="text-2xl">
                {organization.name?.charAt(0).toUpperCase() || "O"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {organization.name || "Organization"}
              </h1>
              {organization.industry && (
                <p className="text-muted-foreground mb-3">{organization.industry}</p>
              )}
              {organization.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {organization.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconInfoCircle className="h-4 w-4" />
                  <span>Profile information is being updated</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
              <div className="text-sm text-muted-foreground">Volunteers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {organization.description ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{organization.description}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <IconInfoCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Organization description coming soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mission */}
            {organization.mission && (
              <Card>
                <CardHeader>
                  <CardTitle>Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{organization.mission}</p>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  {events.length > 0
                    ? `${events.length} upcoming event${events.length !== 1 ? "s" : ""}`
                    : "No upcoming events"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                            {event.shortDescription && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {event.shortDescription}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <IconCalendar className="h-4 w-4" />
                                <span>{formatDate(event.startsAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <IconMapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                              {event.timeCommitmentHours && (
                                <div className="flex items-center gap-1.5">
                                  <IconClock className="h-4 w-4" />
                                  <span>{event.timeCommitmentHours} hours</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <IconUsers className="h-4 w-4" />
                                <span>
                                  {event.volunteersSignedUp} / {event.volunteersNeeded} volunteers
                                </span>
                              </div>
                            </div>
                            {event.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {event.specialties.map((specialty) => (
                                  <Badge key={specialty} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button asChild variant="outline" className="sm:ml-4">
                            <Link href={`/vol/explore?event=${event.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <IconCalendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">
                      No upcoming events at this time
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Check back soon for new opportunities
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {organization.contactName || organization.contactEmail || organization.contactPhone || organization.contacts.length > 0 ? (
                  <>
                    {organization.contactName && (
                      <div>
                        <div className="text-sm font-medium mb-1">Primary Contact</div>
                        <div className="text-sm text-muted-foreground">{organization.contactName}</div>
                      </div>
                    )}
                    {organization.contactEmail && (
                      <div className="flex items-center gap-2">
                        <IconMail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${organization.contactEmail}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {organization.contactEmail}
                        </a>
                      </div>
                    )}
                    {organization.contactPhone && (
                      <div className="flex items-center gap-2">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${organization.contactPhone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {organization.contactPhone}
                        </a>
                      </div>
                    )}

                    {/* Additional Contacts */}
                    {organization.contacts.length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-3">Additional Contacts</div>
                        <div className="space-y-3">
                          {organization.contacts.map((contact) => (
                            <div key={contact.id}>
                              <div className="text-sm font-medium">{contact.name}</div>
                              {contact.role && (
                                <div className="text-xs text-muted-foreground">{contact.role}</div>
                              )}
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-xs text-primary hover:underline block"
                                >
                                  {contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-xs text-primary hover:underline block"
                                >
                                  {contact.phone}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <IconInfoCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Contact information coming soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media - Only show if at least one social link exists */}
            {(organization.twitter ||
              organization.instagram ||
              organization.facebook ||
              organization.linkedin) && (
              <Card>
                <CardHeader>
                  <CardTitle>Follow Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {organization.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={organization.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <IconBrandTwitter className="h-4 w-4" />
                          Twitter
                          <IconExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {organization.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={organization.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <IconBrandInstagram className="h-4 w-4" />
                          Instagram
                          <IconExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {organization.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={organization.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <IconBrandFacebook className="h-4 w-4" />
                          Facebook
                          <IconExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {organization.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={organization.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <IconBrandLinkedin className="h-4 w-4" />
                          LinkedIn
                          <IconExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Events Per Month Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Events Per Month</CardTitle>
                <CardDescription>
                  Event activity over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventsPerMonthChart data={monthlyEvents} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

