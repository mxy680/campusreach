"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { IconBell } from "@tabler/icons-react"
import { ChartAreaLinear } from "../components/chart-area-linear"

export default function Page() {
  const announcements = [
    { id: "a1", title: "Welcome to CampusReach Org Portal", body: "Track sign-ups, manage events, and message students from one place.", date: "2025-09-15" },
    { id: "a2", title: "New: Opportunities Page", body: "Create and manage opportunities with images, skills, and progress tracking.", date: "2025-09-20" },
    { id: "a3", title: "Reminder: Verify your profile", body: "Add a logo and contact info so students recognize your org.", date: "2025-09-25" },
  ]

  // Datasets for charts (placeholder values)
  const signupsData = [
    { month: "January", signups: 186 },
    { month: "February", signups: 305 },
    { month: "March", signups: 237 },
    { month: "April", signups: 73 },
    { month: "May", signups: 209 },
    { month: "June", signups: 214 },
  ]
  const eventsData = [
    { month: "January", events: 2 },
    { month: "February", events: 3 },
    { month: "March", events: 4 },
    { month: "April", events: 1 },
    { month: "May", events: 3 },
    { month: "June", events: 5 },
  ]
  const hoursData = [
    { month: "January", hours: 12 },
    { month: "February", hours: 18 },
    { month: "March", hours: 22 },
    { month: "April", hours: 16 },
    { month: "May", hours: 28 },
    { month: "June", hours: 30 },
  ]

  return (
    <main className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChartAreaLinear
          title="Sign-ups"
          description="Showing student sign-ups for the last 6 months"
          data={signupsData}
          dataKey="signups"
          label="Sign-ups"
          colorVar="hsl(24 95% 55%)"
          footerSecondary="Jan - Jun 2025"
        />
        <ChartAreaLinear
          title="Upcoming events"
          description="Events scheduled over the last 6 months"
          data={eventsData}
          dataKey="events"
          label="Events"
          colorVar="hsl(24 90% 50%)"
          footerSecondary="Jan - Jun 2025"
        />
        <ChartAreaLinear
          title="Hours logged"
          description="Volunteer hours recorded over the last 6 months"
          data={hoursData}
          dataKey="hours"
          label="Hours"
          colorVar="hsl(24 80% 45%)"
          footerSecondary="Jan - Jun 2025"
        />
      </div>

      {/* Announcements */}
      <Card className="py-2">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b p-3 text-sm font-medium">
            <IconBell className="size-4 text-muted-foreground" />
            <span>Announcements</span>
            <span className="ml-auto rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{announcements.length}</span>
          </div>
          <ul className="divide-y">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 p-3 hover:bg-muted/40">
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.title}</div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                </div>
                <div className="shrink-0">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
