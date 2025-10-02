"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { IconBell } from "@tabler/icons-react"
import { ChartAreaLinear } from "../components/chart-area-linear"
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

  // Sign-ups: fetch last 6 months for the active organization
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [signupsData, setSignupsData] = React.useState<{ month: string; signups: number }[]>(() => {
    const now = new Date()
    const months: { month: string; signups: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(now.getMonth() - i)
      months.push({ month: d.toLocaleString(undefined, { month: "long" }), signups: 0 })
    }
    return months
  })
  React.useEffect(() => {
    // Try to detect orgId from a server hint endpoint if present; for now, load first org the user belongs to
    const ctrl = new AbortController()
    fetch("/api/orgs", { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const first = (json?.data ?? [])[0]?.id as string | undefined
        if (first) setOrgId(first)
      })
      .catch(() => { })
    return () => ctrl.abort()
  }, [])
  React.useEffect(() => {
    if (!orgId) return
    const ctrl = new AbortController()
    fetch(`/api/org/signups?orgId=${encodeURIComponent(orgId)}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const rows = (json?.data ?? []) as { month: string; signups: number }[]
        if (Array.isArray(rows) && rows.length) setSignupsData(rows)
      })
      .catch(() => { })
    return () => ctrl.abort()
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
    const ctrl = new AbortController()
    fetch(`/api/org/events-stats?orgId=${encodeURIComponent(orgId)}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const rows = (json?.data ?? []) as { month: string; events: number }[]
        if (Array.isArray(rows) && rows.length) setEventsData(rows)
      })
      .catch(() => { })
    return () => ctrl.abort()
  }, [orgId])
  // (hours effect removed)

  const rangeFooter = React.useMemo(() => {
    if (!signupsData.length) return ""
    const now = new Date()
    const start = new Date(now)
    start.setMonth(now.getMonth() - 5)
    return `${start.toLocaleString(undefined, { month: "short" })} - ${now.toLocaleString(undefined, { month: "short" })} ${now.getFullYear()}`
  }, [signupsData])
  const eventsFooter = rangeFooter

  // Platform signups (students vs orgs)
  const [platformData, setPlatformData] = React.useState<PlatformBarDatum[]>([])
  React.useEffect(() => {
    const ctrl = new AbortController()
    fetch("/api/platform/signups", { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setPlatformData((json?.data ?? []) as PlatformBarDatum[])
      })
      .catch(() => { })
    return () => ctrl.abort()
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

  const signupsTrend = trendString(signupsData.map((d) => d.signups))
  const eventsTrend = trendString(eventsData.map((d) => d.events))
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
          footerPrimary={signupsTrend || undefined}
          footerSecondary={rangeFooter}
        />
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
