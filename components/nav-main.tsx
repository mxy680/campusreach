"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { IconAlertCircle } from "@tabler/icons-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  showScheduleEvent = false,
  profileIncomplete = false,
  profileIncompleteReason = "",
  hoursNotVerified = false,
  hoursNotVerifiedReason = "",
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    disabled?: boolean
  }[]
  showScheduleEvent?: boolean
  profileIncomplete?: boolean
  profileIncompleteReason?: string
  hoursNotVerified?: boolean
  hoursNotVerifiedReason?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [selectedSpecialties, setSelectedSpecialties] = React.useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [title, setTitle] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [datetime, setDatetime] = React.useState("")
  const [volunteers, setVolunteers] = React.useState<number | "">("")
  const [timeCommitment, setTimeCommitment] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const resetForm = () => {
    setTitle("")
    setDesc("")
    setLocation("")
    setDatetime("")
    setVolunteers("")
    setTimeCommitment("")
    setNotes("")
    setSelectedSpecialties([])
    setSelectedFiles([])
  }
  const specialtyOptions: string[] = [
    "Environmental Science",
    "Public Health",
    "Computer Science",
    "Business",
    "Education",
    "Biology",
    "Mechanical Engineering",
    "Nursing",
  ]

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
    const randomSkills = specialtyOptions.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1) // 1-3 random skills

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
    setDesc(randomDescription)
    setDatetime(dateTimeString)
    setLocation(randomLocation)
    setVolunteers(randomVolunteers)
    setTimeCommitment(randomTimeCommitment)
    setNotes(randomNotes)
    setSelectedSpecialties(randomSkills)
  }

  // Check if we're in development mode
  // In Next.js, NODE_ENV is available in client components during build
  const isDev = process.env.NODE_ENV === "development"
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {showScheduleEvent && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <Dialog
                open={open}
                onOpenChange={(o) => {
                  setOpen(o)
                  if (!o) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Schedule Event"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                  >
                    <IconCirclePlusFilled />
                    <span>Schedule Event</span>
                  </SidebarMenuButton>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule an Event</DialogTitle>
                  <DialogDescription>
                    Set up your organization&apos;s upcoming event. We&apos;ll add fields next.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!title || !desc || !datetime || !location || !volunteers) {
                      toast.error("Please fill in all required fields")
                      return
                    }
                    try {
                      setSubmitting(true)
                      const response = await fetch("/api/org/opportunities", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          title,
                          description: desc,
                          dateTime: datetime,
                          location,
                          volunteersNeeded: String(volunteers),
                          timeCommitment: timeCommitment || null,
                          notes: notes || null,
                          skills: selectedSpecialties,
                          attachments: [], // TODO: Implement file upload
                        }),
                      })

                      if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.error || "Failed to create event")
                      }

                      toast.success("Event created successfully!")
                      setOpen(false)
                      // Refresh the page to show the new event
                      router.refresh()
                    } catch (error: unknown) {
                      console.error("Error creating event:", error)
                      const message = error instanceof Error ? error.message : "Failed to create event. Please try again."
                      toast.error(message)
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Title *</Label>
                    <Input id="event-title" placeholder="e.g. Campus Cleanup Day" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-desc">Description *</Label>
                    <textarea
                      id="event-desc"
                      className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Briefly describe the event"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="event-datetime">Date & time *</Label>
                      <Input id="event-datetime" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-volunteers">Number of volunteers needed *</Label>
                      <Input id="event-volunteers" type="number" min={1} placeholder="e.g. 10" value={volunteers} onChange={(e) => setVolunteers(e.target.value ? Number(e.target.value) : "")} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="event-location">Location *</Label>
                      <Input id="event-location" placeholder="e.g. Main Campus, Room 101" value={location} onChange={(e) => setLocation(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-time-commitment">Time commitment (hours)</Label>
                      <Input id="event-time-commitment" type="number" min="0" step="0.5" placeholder="e.g. 2.5" value={timeCommitment} onChange={(e) => setTimeCommitment(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-notes">Additional notes</Label>
                    <textarea
                      id="event-notes"
                      className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Any additional information for volunteers..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="relative w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <div className="pointer-events-none flex min-h-6 flex-wrap items-center gap-1.5">
                        {selectedFiles.length > 0 ? (
                          <>
                            {selectedFiles.slice(0, 3).map((f) => (
                              <Badge key={f.name + f.size} variant="secondary">{f.name}</Badge>
                            ))}
                            {selectedFiles.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{selectedFiles.length - 3}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Click to choose files</span>
                        )}
                      </div>
                      <input
                        aria-label="Upload attachments"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => {
                          const list = e.target.files
                          if (!list) return
                          const picked = Array.from(list)
                          setSelectedFiles((prev) => {
                            const map = new Map<string, File>(prev.map((f) => [f.name + f.size, f]))
                            for (const f of picked) {
                              map.set(f.name + f.size, f)
                            }
                            return Array.from(map.values())
                          })
                          // reset input so the same files can be picked again
                          e.currentTarget.value = ""
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Desired specialties/majors</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {selectedSpecialties.length > 0 ? (
                            <div className="flex items-center gap-1.5 truncate">
                              {selectedSpecialties.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                              {selectedSpecialties.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{selectedSpecialties.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Select specialties</span>
                          )}
                          <ChevronDown className="ml-2 size-4 opacity-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-72">
                        {selectedSpecialties.length > 0 && (
                          <div className="px-2 py-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              {selectedSpecialties.map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Select all */}
                        <DropdownMenuCheckboxItem
                          checked={selectedSpecialties.length === specialtyOptions.length}
                          onCheckedChange={(isChecked) => {
                            setSelectedSpecialties(isChecked ? [...specialtyOptions] : [])
                          }}
                        >
                          Select all
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {specialtyOptions.map((opt) => {
                          const checked = selectedSpecialties.includes(opt)
                          return (
                            <DropdownMenuCheckboxItem
                              key={opt}
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                setSelectedSpecialties((prev) =>
                                  isChecked ? [...prev, opt] : prev.filter((v) => v !== opt)
                                )
                              }}
                            >
                              {opt}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    {isDev && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAutofill}
                        disabled={submitting}
                        className="mr-auto"
                      >
                        Autofill
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting || !title || !desc || !datetime || !location || !volunteers}>
                      {submitting ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.disabled ? (
                <SidebarMenuButton
                  tooltip={`${item.title} (disabled)`}
                  className="opacity-50 cursor-not-allowed"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton 
                  tooltip={item.title} 
                  asChild
                  isActive={
                    pathname === item.url || 
                    (item.url !== "/org" && pathname?.startsWith(item.url + "/")) ||
                    (item.url === "/org" && (pathname === "/org" || pathname === "/org/"))
                  }
                >
                  <Link href={item.url} className="flex items-center gap-2 w-full">
                    {item.icon && <item.icon />}
                    <span className="flex-1">{item.title}</span>
                    {profileIncomplete && item.title === "Profile" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconAlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{profileIncompleteReason || "Profile incomplete"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {hoursNotVerified && item.title === "Volunteer Management" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconAlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{hoursNotVerifiedReason || "Not all hours verified"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
