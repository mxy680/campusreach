"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconBell } from "@tabler/icons-react"
import { Pie, PieChart } from "recharts"
import { ChartContainer, type ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ChartBarMultiple, type PlatformBarDatum } from "../components/chart-bar-multiple"
import { ChartBarSingle } from "../components/chart-bar-single"

export default function Page() {
  const announcements = [
    { id: "a1", title: "Welcome to CampusReach Org Portal", body: "Track sign-ups, manage events, and message students from one place.", date: "2025-09-15" },
    { id: "a2", title: "New: Opportunities Page", body: "Create and manage opportunities with images, skills, and progress tracking.", date: "2025-09-20" },
    { id: "a3", title: "Reminder: Verify your profile", body: "Add a logo and contact info so students recognize your org.", date: "2025-09-25" },
    { id: "a4", title: "Tip: Use Messaging", body: "Reach out to interested students directly from the Messaging tab.", date: "2025-09-26" },
    { id: "a5", title: "Export Reports", body: "Download monthly summaries of sign-ups and hours from the dashboard.", date: "2025-09-27" },
  ]

  // Active organization id
  const [orgId, setOrgId] = React.useState<string | null>(null)
  // Ratings distribution for org events (1..5)
  const [ratingCounts, setRatingCounts] = React.useState<number[]>([0, 0, 0, 0, 0])
  const ratingChartConfig = {
    one: { label: "1★", color: "var(--chart-1)" },
    two: { label: "2★", color: "var(--chart-2)" },
    three: { label: "3★", color: "var(--chart-3)" },
    four: { label: "4★", color: "var(--chart-4)" },
    five: { label: "5★", color: "var(--chart-5)" },
  } satisfies ChartConfig
  React.useEffect(() => {
    // Try to detect orgId from a server hint endpoint if present; for now, load first org the user belongs to
    fetch("/api/orgs")
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const first = (json?.data ?? [])[0]?.id as string | undefined
        if (first) setOrgId(first)
      })
      .catch(() => {})
  }, [])
  React.useEffect(() => {
    if (!orgId) return
    fetch(`/api/org/ratings-distribution?orgId=${encodeURIComponent(orgId)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const counts = (json?.data ?? [0,0,0,0,0]) as number[]
        if (Array.isArray(counts) && counts.length === 5) setRatingCounts(counts)
      })
      .catch(() => {})
  }, [orgId])
  const [eventsData, setEventsData] = React.useState<{ month: string; events: number }[]>(() => {
    const now = new Date()
    const months: { month: string; events: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(now.getMonth() - i)
      months.push({ month: d.toLocaleString(undefined, { month: "long" }), events: 0 })
    }
    return months
  })
  // Removed hours chart; keeping signups and events
  React.useEffect(() => {
    if (!orgId) return
    fetch(`/api/org/events-stats?orgId=${encodeURIComponent(orgId)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const rows = (json?.data ?? []) as { month: string; events: number }[]
        if (Array.isArray(rows) && rows.length) setEventsData(rows)
      })
      .catch(() => {})
  }, [orgId])
  const totalRatings = ratingCounts.reduce((a, b) => a + b, 0)
  const ratingData = [
    { key: "one", label: "1★", value: ratingCounts[0], fill: "var(--chart-1)" },
    { key: "two", label: "2★", value: ratingCounts[1], fill: "var(--chart-2)" },
    { key: "three", label: "3★", value: ratingCounts[2], fill: "var(--chart-3)" },
    { key: "four", label: "4★", value: ratingCounts[3], fill: "var(--chart-4)" },
    { key: "five", label: "5★", value: ratingCounts[4], fill: "var(--chart-5)" },
  ]
  const eventsFooter = React.useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setMonth(now.getMonth() - 5)
    return `${start.toLocaleString(undefined, { month: "short" })} - ${now.toLocaleString(undefined, { month: "short" })} ${now.getFullYear()}`
  }, [])

  // Platform signups (students vs orgs)
  const [platformData, setPlatformData] = React.useState<PlatformBarDatum[]>([])
  React.useEffect(() => {
    fetch("/api/platform/signups")
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setPlatformData((json?.data ?? []) as PlatformBarDatum[])
      })
      .catch(() => {})
  }, [])
  const platformTrend = (() => {
    if (platformData.length < 2) return ""
    const lastS = platformData[platformData.length - 1].students
    const prevS = platformData[platformData.length - 2].students
    const lastO = platformData[platformData.length - 1].orgs
    const prevO = platformData[platformData.length - 2].orgs
    const last = lastS + lastO
    const prev = prevS + prevO
    if (last === prev) return "No change this month"
    const pct = prev === 0 ? (last > 0 ? 100 : 0) : Math.abs(((last - prev) / prev) * 100)
    const dir = last >= prev ? "up" : "down"
    const formatted = pct.toFixed(1).replace(/\.0$/, "")
    return `Trending ${dir} by ${formatted}% this month`
  })()

  // platform range is computed inline where used

  // Compute month-over-month trend strings (e.g., "Trending up by 5.2% this month")
  const trendString = (values: number[]) => {
    if (values.length < 2) return ""
    const last = values[values.length - 1] || 0
    const prev = values[values.length - 2] || 0
    if (last === prev) return "No change this month"
    const pct = prev === 0 ? (last > 0 ? 100 : 0) : Math.abs(((last - prev) / prev) * 100)
    const dir = last >= prev ? "up" : "down"
    const formatted = pct.toFixed(1).replace(/\.0$/, "")
    return `Trending ${dir} by ${formatted}% this month`
  }

  const eventsTrend = trendString(eventsData.map((d) => d.events))
  return (
    <main className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle>Event ratings</CardTitle>
            <CardDescription>Across your events</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <div className="flex items-center justify-between gap-4">
              <ChartContainer config={ratingChartConfig} className="h-[120px] w-[120px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={ratingData}
                    dataKey="value"
                    nameKey="label"
                    stroke="0"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={1}
                  />
                </PieChart>
              </ChartContainer>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2 text-sm">
                  {(() => {
                    const sum = totalRatings || 1
                    const avg = (1*ratingCounts[0] + 2*ratingCounts[1] + 3*ratingCounts[2] + 4*ratingCounts[3] + 5*ratingCounts[4]) / sum
                    const rounded = Math.round((avg + Number.EPSILON) * 10) / 10
                    return (
                      <>
                        <span className="font-medium">Avg:</span>
                        <span className="tabular-nums">{rounded.toFixed(1)}</span>
                        <span className="ml-1 text-yellow-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < Math.round(avg) ? "★" : "☆"}</span>
                          ))}
                        </span>
                      </>
                    )
                  })()}
                </div>
                <ul className="grid gap-1 text-xs">
                  {ratingData.filter((s) => s.value > 0).map((s) => {
                    const pct = totalRatings ? Math.round((s.value / totalRatings) * 100) : 0
                    return (
                      <li key={s.key} className="flex items-center gap-2 whitespace-nowrap">
                        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: s.fill as string }} />
                        <span className="min-w-[2rem] tabular-nums text-muted-foreground">{s.label}</span>
                        <span className="ml-auto tabular-nums text-foreground/80">{s.value}</span>
                        <span className="w-10 text-right tabular-nums text-muted-foreground">{pct}%</span>
                      </li>
                    )
                  })}
                  {totalRatings === 0 && <li className="text-muted-foreground">No ratings yet</li>}
                </ul>
              </div>
            </div>
          </CardContent>
          <div className="px-4 pb-3 text-[11px] text-muted-foreground">
            {totalRatings ? `${totalRatings} total ratings` : "No ratings yet"}
          </div>
        </Card>
        <ChartBarSingle
          title="Events hosted"
          description="Number of events per month (last 6 months)"
          data={eventsData}
          dataKey="events"
          label="Events"
          colorVar="hsl(24 95% 55%)"
          footerPrimary={eventsTrend || undefined}
          footerSecondary={eventsFooter}
        />
        <ChartBarMultiple
          title="Platform signups"
          description="Students vs organizations"
          data={platformData}
          footerPrimary={platformTrend || undefined}
          footerSecondary={(() => {
            if (!platformData.length) return ""
            const first = platformData[0]?.month
            const last = platformData[platformData.length - 1]?.month
            const year = new Date().getFullYear()
            return `${first} - ${last} ${year}`
          })()}
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
