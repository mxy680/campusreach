"use client"

import * as React from "react"
import { DataTable, schema } from "../components/data-table"
import { Skeleton } from "@/components/ui/skeleton"

const eventOptions = [
  { id: "event-1", label: "Campus Cleanup Day" },
  { id: "event-2", label: "Food Drive" },
  { id: "event-3", label: "Park Restoration" },
] as const

const eventData: Record<string, Array<import("zod").z.infer<typeof schema>>> = {
  "event-1": [
    {
      id: 1,
      volunteerName: "Alex Johnson",
      pronouns: "they/them",
      major: "Computer Science",
      gradDate: "2025-05-15T00:00:00.000Z",
      signedUpAt: "2025-01-10T14:30:00.000Z",
      accepted: true,
      email: "alex.johnson@example.com",
      phone: "(555) 123-4567",
      totalHours: 12,
      notes: "Prefers weekend events",
      avatarUrl: "",
    },
    {
      id: 2,
      volunteerName: "Sam Lee",
      pronouns: "she/her",
      major: "Biology",
      gradDate: "2026-12-20T00:00:00.000Z",
      signedUpAt: "2025-02-05T09:00:00.000Z",
      accepted: false,
      email: "sam.lee@example.com",
      phone: "(555) 987-6543",
      totalHours: 4,
      notes: "Interested in health outreach",
      avatarUrl: "",
    },
    {
      id: 3,
      volunteerName: "Jordan Patel",
      pronouns: "he/him",
      major: "Public Health",
      gradDate: "2025-08-01T00:00:00.000Z",
      signedUpAt: "2025-03-01T16:45:00.000Z",
      accepted: true,
      email: "jordan.patel@example.com",
      phone: "(555) 555-1212",
      totalHours: 20,
      notes: "Team lead candidate",
      avatarUrl: "",
    },
  ],
  "event-2": [
    {
      id: 4,
      volunteerName: "Maya Chen",
      pronouns: "she/her",
      major: "Business",
      gradDate: "2025-11-01T00:00:00.000Z",
      signedUpAt: "2025-03-12T11:10:00.000Z",
      accepted: true,
      email: "maya.chen@example.com",
      phone: "(555) 246-8101",
      totalHours: 6,
      notes: "Can coordinate logistics",
      avatarUrl: "",
    },
  ],
  "event-3": [
    {
      id: 5,
      volunteerName: "Omar Ali",
      pronouns: "he/him",
      major: "Environmental Science",
      gradDate: "2025-06-01T00:00:00.000Z",
      signedUpAt: "2025-04-02T10:00:00.000Z",
      accepted: true,
      email: "omar.ali@example.com",
      phone: "(555) 777-2222",
      totalHours: 10,
      notes: "Leads planting crew",
      avatarUrl: "",
    },
  ],
}

export default function Page() {
  const [eventId, setEventId] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const [skeletonVisible, setSkeletonVisible] = React.useState(false)
  // Restore persisted selected event
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("org:dashboard:selectedEvent")
      if (saved) {
        setEventId(saved)
      } else {
        setEventId(eventOptions[0].id)
      }
    } catch {
      setEventId(eventOptions[0].id)
    } finally {
      setReady(true)
    }
  }, [])
  // Persist on change
  React.useEffect(() => {
    if (!eventId) return
    try {
      localStorage.setItem("org:dashboard:selectedEvent", eventId)
    } catch { }
  }, [eventId])
  // Trigger skeleton fade-in on first paint
  React.useEffect(() => {
    if (!ready || eventId) return
    const id = requestAnimationFrame(() => setSkeletonVisible(true))
    return () => cancelAnimationFrame(id)
  }, [ready, eventId])
  if (!ready || !eventId) {
    return (
      <main className={`p-6 space-y-4 transition-opacity duration-300 ${skeletonVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="rounded-lg border">
          <div className="border-b p-3">
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 p-3">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }
  const rows = eventData[eventId] ?? []
  return (
    <main className="p-6">
      <DataTable
        data={rows}
        eventOptions={eventOptions as unknown as { id: string; label: string }[]}
        eventValue={eventId}
        onEventChange={(id) => setEventId(id)}
      />
    </main>
  )
}
