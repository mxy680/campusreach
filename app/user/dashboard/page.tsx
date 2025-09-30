"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCalendar } from "@tabler/icons-react"
import { ChartAreaLinear } from "../../org/components/chart-area-linear"
import { Pie, PieChart } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

type Opportunity = {
  id: string
  title: string
  org: string
  when: string // ISO
  location: string
  need: number
  joined: number
}

export default function Page() {
  // Placeholder data for UI scaffolding
  const joinedData = [
    { month: "Jan", joined: 1 },
    { month: "Feb", joined: 1 },
    { month: "Mar", joined: 2 },
    { month: "Apr", joined: 1 },
    { month: "May", joined: 2 },
    { month: "Jun", joined: 1 },
  ]
  // Pie chart: organizations volunteered with (counts)
  const orgPieData = [
    { org: "Campus Housing", count: 4, fill: "var(--chart-1)" },
    { org: "City Food Bank", count: 3, fill: "var(--chart-2)" },
    { org: "BrightKids", count: 2, fill: "var(--chart-3)" },
    { org: "Parks Dept", count: 2, fill: "var(--chart-4)" },
    { org: "Other", count: 1, fill: "var(--chart-5)" },
  ]
  const orgPieConfig = {
    count: { label: "Shifts" },
    "Campus Housing": { label: "Campus Housing", color: "var(--chart-1)" },
    "City Food Bank": { label: "City Food Bank", color: "var(--chart-2)" },
    BrightKids: { label: "BrightKids", color: "var(--chart-3)" },
    "Parks Dept": { label: "Parks Dept", color: "var(--chart-4)" },
    Other: { label: "Other", color: "var(--chart-5)" },
  } satisfies ChartConfig
  const hoursData = [
    { month: "Jan", hours: 2.0 },
    { month: "Feb", hours: 1.5 },
    { month: "Mar", hours: 0.5 },
    { month: "Apr", hours: 1.0 },
    { month: "May", hours: 0.75 },
    { month: "Jun", hours: 0.75 },
  ]
  const upcomingJoined: Opportunity[] = [
    { id: "j1", title: "Move‑In Volunteer", org: "Campus Housing", when: "2025-10-01T14:00:00.000Z", location: "North Res Halls", need: 20, joined: 12 },
    { id: "j2", title: "Food Pantry Shift", org: "City Food Bank", when: "2025-10-03T16:30:00.000Z", location: "Downtown Center", need: 10, joined: 8 },
  ]
  const suggested: Opportunity[] = [
    { id: "s1", title: "STEM Tutor (Middle School)", org: "BrightKids", when: "2025-10-05T20:00:00.000Z", location: "Civic Library", need: 8, joined: 3 },
    { id: "s2", title: "Park Cleanup Weekend", org: "City Parks", when: "2025-10-12T14:00:00.000Z", location: "Riverfront Park", need: 25, joined: 7 },
    { id: "s3", title: "Senior Tech Help Night", org: "Community Center", when: "2025-10-07T23:00:00.000Z", location: "Maple Center", need: 6, joined: 2 },
  ]
  const messages = [
    { id: "m1", from: "Campus Housing", subject: "Shift details for Move‑In", date: "Today" },
    { id: "m2", from: "BrightKids", subject: "Schedule preferences", date: "Yesterday" },
  ]

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <main className="p-4 space-y-4">
      {/* Top charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChartAreaLinear
          title="Hours"
          description="Hours logged"
          data={hoursData}
          dataKey="hours"
          label="Hours"
          colorVar="hsl(24 90% 50%)"
          xKey="month"
          xTickFormatter={(v) => String(v)}
          footerSecondary="Jan - Jun"
        />
        <ChartAreaLinear
          title="Events joined"
          description="Per month"
          data={joinedData}
          dataKey="joined"
          label="Joined"
          colorVar="hsl(30 85% 48%)"
          xKey="month"
          xTickFormatter={(v) => String(v)}
          footerSecondary="Jan - Jun"
        />
        <Card className="flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle>Where you volunteer</CardTitle>
            <CardDescription className="text-[11px]">Past 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pb-2">
            <ChartContainer config={orgPieConfig} className="h-28 w-28">
              <PieChart>
                <Pie data={orgPieData} dataKey="count" nameKey="org" stroke="0" />
              </PieChart>
            </ChartContainer>
            {(() => {
              const total = orgPieData.reduce((sum, s) => sum + s.count, 0)
              const top = [...orgPieData].sort((a, b) => b.count - a.count).slice(0, 5)
              return (
                <ul className="grid gap-1 text-xs min-w-[10rem]">
                  {top.map((s) => {
                    const pct = total ? Math.round((s.count / total) * 100) : 0
                    return (
                      <li key={s.org} className="flex w-full items-center gap-2 whitespace-nowrap">
                        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: s.fill as string }} />
                        <span className="truncate text-foreground/80">{s.org}</span>
                        <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
                      </li>
                    )
                  })}
                </ul>
              )
            })()}
          </CardContent>
          <div className="px-3 pb-2 text-[11px] text-muted-foreground">Breakdown of your shifts by organization (last 6 months)</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming joined */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-2 p-3">
            <div className="text-sm font-medium">Your upcoming opportunities</div>
            {upcomingJoined.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming shifts yet.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {upcomingJoined.map((ev) => (
                  <li key={ev.id} className="grid grid-cols-1 gap-3 p-2.5 md:grid-cols-12 md:items-center">
                    <div className="md:col-span-6 min-w-0">
                      <div className="truncate font-medium">{ev.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{ev.org} • {ev.location}</div>
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCalendar className="size-4" />
                        <span>{fmt(ev.when)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const pct = Math.min(100, Math.round((ev.joined / Math.max(1, ev.need)) * 100))
                          return (
                            <div className="h-2 w-40 rounded bg-muted">
                              <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          )
                        })()}
                        <span className="text-xs text-muted-foreground">{ev.joined}/{ev.need}</span>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/user/opportunities`}>Details</a>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Messages preview */}
        <Card>
          <CardContent className="space-y-2 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Messages</div>
              <Button size="sm" variant="ghost" asChild>
                <a href="/user/messaging">See all</a>
              </Button>
            </div>
            <ul className="divide-y rounded-md border">
              {messages.map((m) => (
                <li key={m.id} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{m.from}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{m.date}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{m.subject}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Suggested opportunities */}
      <Card>
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Suggested for you</div>
            <Button size="sm" variant="ghost" asChild>
              <a href="/user/opportunities">Browse all</a>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {suggested.map((ev) => (
              <div key={ev.id} className="rounded-md border p-2.5 hover:bg-muted/40">
                <div className="truncate font-medium">{ev.title}</div>
                <div className="truncate text-xs text-muted-foreground">{ev.org} • {ev.location}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <IconCalendar className="size-4" />
                  <span>{fmt(ev.when)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{ev.joined}/{ev.need}</span>
                  <Button size="sm" className="h-7 px-3" asChild>
                    <a href="/user/opportunities">Sign up</a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
