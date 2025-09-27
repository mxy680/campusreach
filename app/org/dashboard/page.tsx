"use client"

import * as React from "react"
import { DataTable, schema } from "../components/data-table"

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
  const [eventId, setEventId] = React.useState<string>(eventOptions[0].id)
  const rows = eventData[eventId] ?? []
  return (
    <main className="p-6">
      <DataTable
        data={rows}
        eventOptions={eventOptions as unknown as { id: string; label: string }[]}
        eventValue={eventId}
        onEventChange={setEventId}
      />
    </main>
  )
}
