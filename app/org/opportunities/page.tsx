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
import { IconCalendar, IconPencil, IconTrash } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

const SKILLS = [
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
]

type Event = {
  id: string
  title: string
  shortDescription: string | null
  startsAt: string
  location: string
  volunteersNeeded: number
  timeCommitmentHours: number | null
  notes: string | null
  specialties: string[]
  signups: Array<{ id: string }>
}

export default function OpportunitiesPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dateTime, setDateTime] = useState("")
  const [location, setLocation] = useState("")
  const [volunteersNeeded, setVolunteersNeeded] = useState("")
  const [timeCommitment, setTimeCommitment] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [upcoming, setUpcoming] = useState<Event[]>([])
  const [past, setPast] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null)

  // Fetch opportunities on mount
  useEffect(() => {
    fetchOpportunities()
  }, [])

  const handleCreateOpportunity = async () => {
    if (!title || !description || !dateTime || !location || !volunteersNeeded) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      // TODO: Handle file uploads to Supabase Storage
      // For now, we'll just send the form data
      const response = await fetch("/api/org/opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          dateTime,
          location,
          volunteersNeeded,
          timeCommitment: timeCommitment || null,
          notes: notes || null,
          skills: selectedSkills,
          attachments: [], // TODO: Add file upload URLs
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create opportunity")
      }

      toast.success("Opportunity created successfully!")

      // Reset form
      setTitle("")
      setDescription("")
      setDateTime("")
      setLocation("")
      setVolunteersNeeded("")
      setTimeCommitment("")
      setNotes("")
      setSelectedSkills([])
      setSelectedFiles([])

      // Refresh opportunities list
      await fetchOpportunities()
    } catch (error: unknown) {
      console.error("Error creating opportunity:", error)
      const message = error instanceof Error ? error.message : "Failed to create opportunity. Please try again."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const fetchOpportunities = async () => {
    try {
      const response = await fetch("/api/org/opportunities")
      if (!response.ok) throw new Error("Failed to fetch opportunities")
      const data = await response.json()
      setUpcoming(data.upcoming || [])
      setPast(data.past || [])
    } catch (error) {
      console.error("Error fetching opportunities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event.id)
    // Pre-fill form with event data
    setTitle(event.title)
    setDescription(event.shortDescription || "")
    // Format date for datetime-local input
    const eventDate = new Date(event.startsAt)
    const year = eventDate.getFullYear()
    const month = String(eventDate.getMonth() + 1).padStart(2, "0")
    const day = String(eventDate.getDate()).padStart(2, "0")
    const hours = String(eventDate.getHours()).padStart(2, "0")
    const minutes = String(eventDate.getMinutes()).padStart(2, "0")
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    setLocation(event.location || "")
    setVolunteersNeeded(String(event.volunteersNeeded))
    setTimeCommitment(event.timeCommitmentHours ? String(event.timeCommitmentHours) : "")
    setNotes(event.notes || "")
    setSelectedSkills(event.specialties || [])
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (eventId: string) => {
    setDeletingEvent(eventId)
    try {
      const response = await fetch(`/api/org/opportunities/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete opportunity")
      }

      toast.success("Opportunity deleted successfully!")
      await fetchOpportunities()
    } catch (error: unknown) {
      console.error("Error deleting opportunity:", error)
      const message = error instanceof Error ? error.message : "Failed to delete opportunity. Please try again."
      toast.error(message)
    } finally {
      setDeletingEvent(null)
    }
  }

  const handleUpdate = async () => {
    if (!editingEvent) return
    if (!title || !description || !dateTime || !location || !volunteersNeeded) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/org/opportunities/${editingEvent}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          dateTime,
          location,
          volunteersNeeded,
          timeCommitment: timeCommitment || null,
          notes: notes || null,
          skills: selectedSkills,
          attachments: [], // TODO: Add file upload URLs
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update opportunity")
      }

      toast.success("Opportunity updated successfully!")
      setEditingEvent(null)
      
      // Reset form
      setTitle("")
      setDescription("")
      setDateTime("")
      setLocation("")
      setVolunteersNeeded("")
      setTimeCommitment("")
      setNotes("")
      setSelectedSkills([])
      setSelectedFiles([])

      // Refresh opportunities list
      await fetchOpportunities()
    } catch (error: unknown) {
      console.error("Error updating opportunity:", error)
      const message = error instanceof Error ? error.message : "Failed to update opportunity. Please try again."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    setSelectedFiles((prev) => {
      const map = new Map<string, File>(
        prev.map((f) => [f.name + f.size, f])
      )
      for (const f of fileArray) {
        map.set(f.name + f.size, f)
      }
      return Array.from(map.values())
    })
  }

  const handleAutofill = () => {
    const eventTitles = [
      "Campus Cleanup Day",
      "Community Garden Planting",
      "Food Drive Collection",
      "Tutoring Session",
      "Beach Cleanup",
      "Senior Center Visit",
      "Animal Shelter Volunteer",
      "Park Restoration Project",
      "Blood Drive",
      "Holiday Toy Drive",
    ]

    const descriptions = [
      "Join us for a day of cleaning up our beautiful campus grounds. We'll provide all necessary supplies.",
      "Help us plant vegetables and flowers in the community garden. No experience necessary!",
      "Collect non-perishable food items for local families in need. Drop-off locations available.",
      "Provide academic support to students in need. Subjects include math, science, and English.",
      "Help keep our beaches clean and protect marine life. We'll meet at the main beach entrance.",
      "Spend time with seniors, play games, and share stories. Bring joy to our community elders.",
      "Help care for animals at the local shelter. Tasks include feeding, walking, and socializing.",
      "Restore native plants and remove invasive species from the park. Tools provided.",
      "Volunteer to help organize and run our community blood drive. Training provided.",
      "Collect and distribute toys to children in need during the holiday season.",
    ]

    const locations = [
      "City Park",
      "Main Campus Quad",
      "Community Center",
      "Downtown Plaza",
      "Riverside Park",
      "Library",
      "Recreation Center",
      "Town Hall",
      "High School Gym",
      "Community Garden",
    ]

    const notes = [
      "Flexible scheduling available",
      "Ongoing weekly commitment",
      "Weather dependent",
      "Bring your own water bottle",
      "Lunch provided",
      "Parking available on-site",
      "Public transportation accessible",
      "Family-friendly event",
      "Training session included",
      "Certificate of participation provided",
    ]

    // Generate random data
    const randomTitle = eventTitles[Math.floor(Math.random() * eventTitles.length)]
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)]
    const randomLocation = locations[Math.floor(Math.random() * locations.length)]
    const randomVolunteers = Math.floor(Math.random() * 50) + 5 // 5-55 volunteers
    const randomTimeCommitment = (Math.random() * 8 + 1).toFixed(1) // 1-9 hours
    const randomNotes = notes[Math.floor(Math.random() * notes.length)]
    const randomSkills = SKILLS.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1) // 1-3 random skills

    // Generate a random date/time in the future (next 30 days)
    const now = new Date()
    const randomDays = Math.floor(Math.random() * 30) + 1
    const randomHours = Math.floor(Math.random() * 12) + 9 // 9 AM - 9 PM
    const randomMinutes = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, or 45
    const randomDate = new Date(now)
    randomDate.setDate(now.getDate() + randomDays)
    randomDate.setHours(randomHours, randomMinutes, 0, 0)

    // Format as datetime-local string (YYYY-MM-DDTHH:mm)
    const year = randomDate.getFullYear()
    const month = String(randomDate.getMonth() + 1).padStart(2, "0")
    const day = String(randomDate.getDate()).padStart(2, "0")
    const hours = String(randomDate.getHours()).padStart(2, "0")
    const minutes = String(randomDate.getMinutes()).padStart(2, "0")
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`

    // Set all fields
    setTitle(randomTitle)
    setDescription(randomDescription)
    setDateTime(dateTimeString)
    setLocation(randomLocation)
    setVolunteersNeeded(String(randomVolunteers))
    setTimeCommitment(randomTimeCommitment)
    setNotes(randomNotes)
    setSelectedSkills(randomSkills)
  }

  const isDev = process.env.NODE_ENV === "development"

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
            <span className="font-medium">Opportunities</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left Panel: Create opportunity */}
          <Card>
            <CardHeader>
              <CardTitle>Create opportunity</CardTitle>
              <CardDescription>
                Publish a new opportunity for students to join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Campus Cleanup Day"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Brief description of the opportunity"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* 2x2 Grid: Date & time, Location, Volunteers needed, Time commitment */}
              <div className="grid grid-cols-2 gap-4">
                {/* Date & time */}
                <div className="space-y-2">
                  <Label htmlFor="datetime">Date & time</Label>
                  <div className="relative">
                    <Input
                      id="datetime"
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      placeholder="mm/dd/yyyy, --:-- --"
                      className="pr-10"
                    />
                    <IconCalendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. City Park"
                  />
                </div>

                {/* Volunteers needed */}
                <div className="space-y-2">
                  <Label htmlFor="volunteers">Volunteers needed</Label>
                  <Input
                    id="volunteers"
                    type="number"
                    min="1"
                    value={volunteersNeeded}
                    onChange={(e) => setVolunteersNeeded(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>

                {/* Time commitment hours (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="time-commitment">
                    Time commitment hours (optional)
                  </Label>
                  <Input
                    id="time-commitment"
                    type="number"
                    min="0"
                    step="0.5"
                    value={timeCommitment}
                    onChange={(e) => setTimeCommitment(e.target.value)}
                    placeholder="e.g. 3"
                  />
                </div>
              </div>

              {/* Notes (optional) */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. flexible scheduling, ongoing weekly, etc."
                />
              </div>

              {/* Skills required and Upload files side by side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Skills required (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills required (optional)</Label>
                  <Select
                    value={selectedSkills.length > 0 ? (selectedSkills.length === 1 ? selectedSkills[0] : "multiple") : ""}
                    onValueChange={(value) => {
                      if (value === "multiple") return // Prevent selecting "multiple" as a skill
                      if (!selectedSkills.includes(value)) {
                        setSelectedSkills([...selectedSkills, value])
                      }
                    }}
                  >
                    <SelectTrigger id="skills" className="w-full">
                      {selectedSkills.length === 0 ? (
                        <SelectValue placeholder="Select skills" />
                      ) : selectedSkills.length === 1 ? (
                        <span className="text-sm">{selectedSkills[0]}</span>
                      ) : (
                        <span className="text-sm">{selectedSkills.length} skills selected</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {SKILLS.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSkills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-xs"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSkills(
                                selectedSkills.filter((s) => s !== skill)
                              )
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                 {/* Upload files */}
                 <div className="space-y-2">
                   <Label>Upload flyer, image, or document</Label>
                   <div className="relative flex items-center w-full rounded-md border border-input bg-background px-3 py-2 h-9">
                     <Button variant="ghost" size="sm" asChild className="h-auto p-0 mr-2">
                       <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium">
                         Choose Files
                       </label>
                     </Button>
                     <input
                       id="file-upload"
                       type="file"
                       multiple
                       accept="image/*,.pdf,.doc,.docx"
                       className="hidden"
                       onChange={handleFileChange}
                     />
                     <span className="text-sm text-muted-foreground">
                       {selectedFiles.length > 0
                         ? `${selectedFiles.length} file(s) chosen`
                         : "No file chosen"}
                     </span>
                   </div>
                 </div>
              </div>

              {/* Create/Update button and Autofill (dev only) */}
              <div className="flex gap-2">
                <Button
                  onClick={editingEvent ? handleUpdate : handleCreateOpportunity}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting 
                    ? (editingEvent ? "Updating..." : "Creating...") 
                    : (editingEvent ? "Update Opportunity" : "Create Opportunity")}
                </Button>
                {editingEvent && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingEvent(null)
                      // Reset form
                      setTitle("")
                      setDescription("")
                      setDateTime("")
                      setLocation("")
                      setVolunteersNeeded("")
                      setTimeCommitment("")
                      setNotes("")
                      setSelectedSkills([])
                      setSelectedFiles([])
                    }}
                  >
                    Cancel
                  </Button>
                )}
                {isDev && !editingEvent && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutofill}
                    className="whitespace-nowrap"
                  >
                    Autofill
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: Your opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Your opportunities</CardTitle>
              <CardDescription>
                Manage upcoming and past opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upcoming */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Upcoming</h3>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : upcoming.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No upcoming opportunities yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-md border p-3 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-sm">{event.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.startsAt).toLocaleDateString()} •{" "}
                              {event.location}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {event.signups?.length || 0} / {event.volunteersNeeded}{" "}
                              volunteers
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(event)}
                              disabled={editingEvent === event.id}
                            >
                              <IconPencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(event.id)}
                              disabled={deletingEvent === event.id}
                            >
                              {deletingEvent === event.id ? (
                                <span className="text-xs">...</span>
                              ) : (
                                <IconTrash className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Past</h3>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : past.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No past opportunities yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {past.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-md border p-3 space-y-1 opacity-60"
                      >
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.startsAt).toLocaleDateString()} •{" "}
                          {event.location}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.signups?.length || 0} / {event.volunteersNeeded}{" "}
                          volunteers
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}

