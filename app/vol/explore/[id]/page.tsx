"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  IconMapPin,
  IconClock,
  IconUsers,
  IconCalendar,
  IconMail,
  IconPhone,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandLinkedin,
  IconExternalLink,
  IconArrowLeft,
} from "@tabler/icons-react"
import Link from "next/link"
import { toast } from "sonner"

type OpportunityData = {
  opportunity: {
    id: string
    title: string
    shortDescription: string | null
    startsAt: string
    endsAt: string | null
    location: string
    volunteersNeeded: number
    notes: string | null
    timeCommitmentHours: number | null
    specialties: string[]
    organization: {
      id: string
      name: string | null
      slug: string | null
      type: "STUDENT" | "COMMUNITY" | null
      logoUrl: string | null
      description: string | null
      contactEmail: string | null
      contactPhone: string | null
      categories: string[]
      twitter: string | null
      instagram: string | null
      facebook: string | null
      linkedin: string | null
    } | null
    signups: Array<{ id: string; volunteerId: string }>
    hasSignedUp: boolean
    signupStatus: string | null
    spotsRemaining: number
  }
}

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const opportunityId = params.id as string
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OpportunityData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signingUp, setSigningUp] = useState(false)
  const [unsigningUp, setUnsigningUp] = useState(false)

  useEffect(() => {
    async function fetchOpportunity() {
      try {
        const response = await fetch(`/api/vol/opportunities/${opportunityId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError("Opportunity not found")
          } else {
            setError("Failed to load opportunity")
          }
          return
        }
        const oppData = await response.json()
        setData(oppData)
      } catch (err) {
        console.error("Error fetching opportunity:", err)
        setError("Failed to load opportunity")
      } finally {
        setLoading(false)
      }
    }

    if (opportunityId) {
      fetchOpportunity()
    }
  }, [opportunityId])

  const handleSignUp = async () => {
    if (!data) return
    setSigningUp(true)
    try {
      const response = await fetch(`/api/vol/opportunities/${opportunityId}/signup`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to sign up")
      }

      // Update local state
      setData((prev) => {
        if (!prev) return prev
        return {
          opportunity: {
            ...prev.opportunity,
            hasSignedUp: true,
            signupStatus: "CONFIRMED",
            spotsRemaining: Math.max(0, prev.opportunity.spotsRemaining - 1),
            signups: [...prev.opportunity.signups, { id: "", volunteerId: "" }],
          },
        }
      })

      toast.success("Successfully signed up for this opportunity!")
    } catch (error: unknown) {
      console.error("Error signing up:", error)
      const message = error instanceof Error ? error.message : "Failed to sign up. Please try again."
      toast.error(message)
    } finally {
      setSigningUp(false)
    }
  }

  const handleUnsignUp = async () => {
    if (!data) return
    setUnsigningUp(true)
    try {
      const response = await fetch(`/api/vol/opportunities/${opportunityId}/signup`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unregister")
      }

      // Update local state
      setData((prev) => {
        if (!prev) return prev
        return {
          opportunity: {
            ...prev.opportunity,
            hasSignedUp: false,
            signupStatus: null,
            spotsRemaining: Math.min(prev.opportunity.volunteersNeeded, prev.opportunity.spotsRemaining + 1),
            signups: prev.opportunity.signups.slice(0, -1),
          },
        }
      })

      toast.success("Successfully unregistered from this opportunity")
    } catch (error: unknown) {
      console.error("Error unregistering:", error)
      const message = error instanceof Error ? error.message : "Failed to unregister. Please try again."
      toast.error(message)
    } finally {
      setUnsigningUp(false)
    }
  }

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

  if (loading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <span className="font-medium">Loading...</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading opportunity...</div>
        </div>
      </SidebarInset>
    )
  }

  if (error || !data) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <span className="font-medium">Error</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Opportunity Not Found</h1>
            <p className="text-muted-foreground mb-4">{error || "The opportunity you're looking for doesn't exist."}</p>
            <Button onClick={() => router.push("/vol/explore")}>
              Back to Explore
            </Button>
          </div>
        </div>
      </SidebarInset>
    )
  }

  const { opportunity } = data
  const org = opportunity.organization

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="flex items-center gap-2">
            <span className="font-medium">Opportunity Details</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Back button */}
        <div>
          <Button variant="ghost" onClick={() => router.push("/vol/explore")}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {org && (
                    <Link href={`/org/${org.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="h-12 w-12">
                        {org.logoUrl && <AvatarImage src={org.logoUrl} alt={org.name || "Organization"} />}
                        <AvatarFallback>{org.name?.charAt(0).toUpperCase() || "O"}</AvatarFallback>
                      </Avatar>
                    </Link>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
                    {org && (
                      <div className="flex items-center gap-2 mt-2">
                        <Link
                          href={`/org/${org.id}`}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {org.name}
                        </Link>
                        {org.type && (
                          <Badge variant={org.type === "STUDENT" ? "default" : "secondary"}>
                            {org.type === "STUDENT" ? "Student" : "Community"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Description */}
                {opportunity.shortDescription && (
                  <p className="text-muted-foreground mb-4">{opportunity.shortDescription}</p>
                )}
                {opportunity.notes && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Additional Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opportunity.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <IconCalendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Starts</div>
                      <div className="text-sm text-muted-foreground">{formatDate(opportunity.startsAt)}</div>
                    </div>
                  </div>
                  {opportunity.endsAt && (
                    <div className="flex items-center gap-3">
                      <IconCalendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Ends</div>
                        <div className="text-sm text-muted-foreground">{formatDate(opportunity.endsAt)}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <IconMapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Location</div>
                      <div className="text-sm text-muted-foreground">{opportunity.location}</div>
                    </div>
                  </div>
                  {opportunity.timeCommitmentHours && (
                    <div className="flex items-center gap-3">
                      <IconClock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Time Commitment</div>
                        <div className="text-sm text-muted-foreground">
                          {opportunity.timeCommitmentHours} hour{opportunity.timeCommitmentHours !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <IconUsers className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Spots Available</div>
                      <div className="text-sm text-muted-foreground">
                        {opportunity.spotsRemaining} of {opportunity.volunteersNeeded} remaining
                      </div>
                    </div>
                  </div>
                </div>

                {opportunity.specialties.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Categories</div>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sign Up Button */}
            <Button
              onClick={() => opportunity.hasSignedUp ? handleUnsignUp() : handleSignUp()}
              disabled={
                (opportunity.hasSignedUp && unsigningUp) ||
                (!opportunity.hasSignedUp && (signingUp || opportunity.spotsRemaining <= 0))
              }
              className={`w-full h-12 text-lg ${
                opportunity.hasSignedUp
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {opportunity.hasSignedUp
                ? unsigningUp
                  ? "Unregistering..."
                  : "Unregister"
                : signingUp
                  ? "Registering..."
                  : opportunity.spotsRemaining <= 0
                    ? "Full"
                    : "Register for this Opportunity"}
            </Button>
          </div>

          {/* Sidebar - Organization Info */}
          {org && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About the Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href={`/org/${org.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      {org.logoUrl && <AvatarImage src={org.logoUrl} alt={org.name || "Organization"} />}
                      <AvatarFallback>{org.name?.charAt(0).toUpperCase() || "O"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{org.name}</div>
                      {org.type && (
                        <div className="text-xs text-muted-foreground">
                          {org.type === "STUDENT" ? "Student Organization" : "Community Organization"}
                        </div>
                      )}
                    </div>
                  </Link>

                  {org.description && (
                    <p className="text-sm text-muted-foreground">{org.description}</p>
                  )}

                  {org.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {org.categories.map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/org/${org.id}`}>
                      View Full Profile
                      <IconExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              {(org.contactEmail || org.contactPhone) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {org.contactEmail && (
                      <div className="flex items-center gap-2">
                        <IconMail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${org.contactEmail}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {org.contactEmail}
                        </a>
                      </div>
                    )}
                    {org.contactPhone && (
                      <div className="flex items-center gap-2">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${org.contactPhone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {org.contactPhone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Social Links */}
              {(org.twitter || org.instagram || org.facebook || org.linkedin) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Follow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {org.twitter && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={org.twitter} target="_blank" rel="noopener noreferrer">
                            <IconBrandTwitter className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {org.instagram && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={org.instagram} target="_blank" rel="noopener noreferrer">
                            <IconBrandInstagram className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {org.facebook && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={org.facebook} target="_blank" rel="noopener noreferrer">
                            <IconBrandFacebook className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {org.linkedin && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={org.linkedin} target="_blank" rel="noopener noreferrer">
                            <IconBrandLinkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  )
}
