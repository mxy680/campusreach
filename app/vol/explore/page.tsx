"use client"

import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconCalendar, IconSearch, IconMapPin, IconClock, IconUsers, IconInfoCircle } from "@tabler/icons-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

const CATEGORIES = [
  "Communication",
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Project Management",
  "Event Planning",
  "Marketing",
  "Social Media",
  "Data Analysis",
  "Teaching",
  "Mentoring",
  "Fundraising",
  "Healthcare",
]

const TIME_COMMITMENTS = [
  "Any",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
]

type Opportunity = {
  id: string
  title: string
  shortDescription: string | null
  startsAt: string
  location: string
  volunteersNeeded: number
  timeCommitmentHours: number | null
  specialties: string[]
  organization: {
    id: string
    name: string | null
    logoUrl: string | null
    type: "STUDENT" | "COMMUNITY" | null
  } | null
  signups: Array<{ id: string; volunteerId: string }>
  hasSignedUp: boolean
  signupStatus: string | null
  spotsRemaining: number
}

export default function ExplorePage() {
  const [search, setSearch] = useState("")
  const [timeCommitment, setTimeCommitment] = useState("Any")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [specialty, setSpecialty] = useState("Any")
  const [orgType, setOrgType] = useState("Any")
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [signingUp, setSigningUp] = useState<string | null>(null)
  const [unsigningUp, setUnsigningUp] = useState<string | null>(null)

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (timeCommitment && timeCommitment !== "Any") {
        params.append("timeCommitment", timeCommitment)
      }
      if (fromDate) params.append("fromDate", fromDate)
      if (toDate) params.append("toDate", toDate)
      if (specialty && specialty !== "Any") {
        params.append("specialty", specialty)
      }
      if (orgType && orgType !== "Any") {
        params.append("orgType", orgType)
      }

      const response = await fetch(`/api/vol/opportunities?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch opportunities")
      const data = await response.json()
      // Sort so signed-up events appear first
      const sorted = (data.opportunities || []).sort((a: Opportunity, b: Opportunity) => {
        if (a.hasSignedUp && !b.hasSignedUp) return -1
        if (!a.hasSignedUp && b.hasSignedUp) return 1
        return 0
      })
      setOpportunities(sorted)
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      toast.error("Failed to load opportunities")
    } finally {
      setLoading(false)
    }
  }, [search, timeCommitment, fromDate, toDate, specialty, orgType])

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  const handleSignUp = async (opportunityId: string) => {
    setSigningUp(opportunityId)
    try {
      const response = await fetch(`/api/vol/opportunities/${opportunityId}/signup`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to sign up")
      }

      // Update local state instead of refetching
      setOpportunities((prev) => {
        const updated = prev.map((opp) => {
          if (opp.id === opportunityId) {
            return {
              ...opp,
              hasSignedUp: true,
              signupStatus: "CONFIRMED",
              spotsRemaining: Math.max(0, opp.spotsRemaining - 1),
              signups: [...opp.signups, { id: "", volunteerId: "" }], // Add placeholder signup
            }
          }
          return opp
        })
        // Sort so signed-up events appear first
        return updated.sort((a, b) => {
          if (a.hasSignedUp && !b.hasSignedUp) return -1
          if (!a.hasSignedUp && b.hasSignedUp) return 1
          return 0
        })
      })

      toast.success("Successfully signed up for this opportunity!")
    } catch (error: unknown) {
      console.error("Error signing up:", error)
      const message = error instanceof Error ? error.message : "Failed to sign up. Please try again."
      toast.error(message)
    } finally {
      setSigningUp(null)
    }
  }

  const handleUnsignUp = async (opportunityId: string) => {
    setUnsigningUp(opportunityId)
    try {
      const response = await fetch(`/api/vol/opportunities/${opportunityId}/signup`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unregister")
      }

      // Update local state instead of refetching
      setOpportunities((prev) => {
        const updated = prev.map((opp) => {
          if (opp.id === opportunityId) {
            return {
              ...opp,
              hasSignedUp: false,
              signupStatus: null,
              spotsRemaining: Math.min(opp.volunteersNeeded, opp.spotsRemaining + 1),
              signups: opp.signups.slice(0, -1), // Remove last signup
            }
          }
          return opp
        })
        // Sort so signed-up events appear first
        return updated.sort((a, b) => {
          if (a.hasSignedUp && !b.hasSignedUp) return -1
          if (!a.hasSignedUp && b.hasSignedUp) return 1
          return 0
        })
      })

      toast.success("Successfully unregistered from this opportunity")
    } catch (error: unknown) {
      console.error("Error unregistering:", error)
      const message = error instanceof Error ? error.message : "Failed to unregister. Please try again."
      toast.error(message)
    } finally {
      setUnsigningUp(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-2">
            <span className="font-medium">Explore</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, org, or keyword"
                    className="pl-9 w-full"
                  />
                </div>
              </div>

              {/* Time commitment */}
              <div className="space-y-2">
                <Label htmlFor="time-commitment">Time commitment</Label>
                <Select value={timeCommitment} onValueChange={setTimeCommitment}>
                  <SelectTrigger id="time-commitment" className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_COMMITMENTS.map((hours) => (
                      <SelectItem key={hours} value={hours}>
                        {hours === "Any" ? "Any" : `${hours} hour${hours !== "1" ? "s" : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* From date */}
              <div className="space-y-2">
                <Label htmlFor="from-date">From</Label>
                <div className="relative">
                  <Input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    placeholder="mm/dd/yyyy"
                    className="pr-10 w-full"
                  />
                  <IconCalendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* To date */}
              <div className="space-y-2">
                <Label htmlFor="to-date">To</Label>
                <div className="relative">
                  <Input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    placeholder="mm/dd/yyyy"
                    className="pr-10 w-full"
                  />
                  <IconCalendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    {CATEGORIES.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Type */}
              <div className="space-y-2">
                <Label htmlFor="org-type">Organization</Label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger id="org-type" className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="COMMUNITY">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="flex flex-1 flex-col min-h-0">
          <CardContent className="px-6 py-2 flex-1 overflow-auto">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading opportunities...
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No opportunities match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="border flex flex-col h-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 min-h-[3.5rem] flex-1">{opportunity.title}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 shrink-0" asChild>
                          <Link href={`/vol/explore/${opportunity.id}`}>
                            <IconInfoCircle className="h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                      {opportunity.organization?.name && (
                        <Link
                          href={`/org/${opportunity.organization.id}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity pt-1"
                        >
                          <Avatar className="h-6 w-6">
                            {opportunity.organization.logoUrl && (
                              <AvatarImage src={opportunity.organization.logoUrl} alt={opportunity.organization.name} />
                            )}
                            <AvatarFallback className="text-xs">
                              {opportunity.organization.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <CardDescription className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            {opportunity.organization.name}
                          </CardDescription>
                        </Link>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 pt-0">
                      {/* Description with fixed height */}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
                        {opportunity.shortDescription || ""}
                      </p>

                      {/* Spacer to push metadata to bottom */}
                      <div className="flex-1 min-h-4" />

                      {/* Metadata section - always at bottom */}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <IconCalendar className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{formatDate(opportunity.startsAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <IconMapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{opportunity.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <IconClock className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                          <span>{opportunity.timeCommitmentHours ? `${opportunity.timeCommitmentHours} hour${opportunity.timeCommitmentHours !== 1 ? "s" : ""}` : "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <IconUsers className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                          <span>
                            {opportunity.spotsRemaining} of {opportunity.volunteersNeeded} spots remaining
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1 min-h-[1.75rem]">
                          {opportunity.specialties.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs font-normal">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          onClick={() => opportunity.hasSignedUp ? handleUnsignUp(opportunity.id) : handleSignUp(opportunity.id)}
                          disabled={(opportunity.hasSignedUp && unsigningUp === opportunity.id) || (!opportunity.hasSignedUp && (signingUp === opportunity.id || opportunity.spotsRemaining <= 0))}
                          className={`w-full ${opportunity.hasSignedUp
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                        >
                          {opportunity.hasSignedUp
                            ? (unsigningUp === opportunity.id ? "Unregistering..." : "Unregister")
                            : (signingUp === opportunity.id
                                ? "Registering..."
                                : opportunity.spotsRemaining <= 0
                                ? "Full"
                                : "Register")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}

