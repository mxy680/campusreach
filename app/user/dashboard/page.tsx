"use client"

import * as React from "react"
const UpcomingJoinedSection = React.lazy(() => import("./sections/UpcomingJoinedSection"))
const MessagesPreviewSection = React.lazy(() => import("./sections/MessagesPreviewSection"))
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconCalendar } from "@tabler/icons-react"
import { ChartAreaLinear } from "../../org/components/chart-area-linear"
import { ChartBarSingle } from "../../org/components/chart-bar-single"
import { Pie, PieChart } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

export default function Page() {
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? ""

  // Hours: load from API, fallback to a flat zero line for the last 6 months
  const [hoursData, setHoursData] = React.useState<{ month: string; hours: number }[]>(() => {
    const now = new Date()
    const months: { month: string; hours: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(now.getMonth() - i)
      months.push({ month: d.toLocaleString(undefined, { month: "short" }), hours: 0 })
    }
    return months
  })
  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/hours?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const data = (json?.data ?? []) as { month: string; hours: number }[]
        if (Array.isArray(data) && data.length) setHoursData(data)
      })
      .catch(() => {})
  }, [userEmail])

  // Placeholder data for UI scaffolding
  const [joinedData, setJoinedData] = React.useState<{ month: string; joined: number }[]>(() => {
    const now = new Date()
    const months: { month: string; joined: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(now.getMonth() - i)
      months.push({ month: d.toLocaleString(undefined, { month: "short" }), joined: 0 })
    }
    return months
  })
  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/joined?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const data = (json?.data ?? []) as { month: string; joined: number }[]
        if (Array.isArray(data) && data.length) setJoinedData(data)
      })
      .catch(() => {})
  }, [userEmail])
  // Pie chart: organizations volunteered with (counts)
  const [orgPieData, setOrgPieData] = React.useState<{ org: string; count: number; fill: string }[]>([])
  const [orgNoData, setOrgNoData] = React.useState(false)
  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/org-breakdown?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const rows = (json?.data ?? []) as { org: string; count: number }[]
        if (!rows.length) {
          // Show an orange "None" slice so the pie always renders
          setOrgNoData(true)
          setOrgPieData([{ org: "None", count: 1, fill: "var(--chart-1)" }])
          return
        }
        setOrgNoData(false)
        const palette = [
          "var(--chart-1)",
          "var(--chart-2)",
          "var(--chart-3)",
          "var(--chart-4)",
          "var(--chart-5)",
        ]
        const colored = rows.map((r, i) => ({ ...r, fill: palette[i % palette.length] }))
        setOrgPieData(colored)
      })
      .catch(() => {})
  }, [userEmail])
  const orgPieConfig = {
    count: { label: "Shifts" },
  } satisfies ChartConfig
  // hoursData is fetched above
  const footerRange = (months: { month: string }[]) =>
    months.length ? `${months[0].month} - ${months[months.length - 1].month}` : ""

  // Compute month-over-month trend strings (e.g., "Trending up by 5.2% this month")
  const trendString = (series: { month: string }[], values: number[]) => {
    if (values.length < 2) return ""
    const last = values[values.length - 1] || 0
    const prev = values[values.length - 2] || 0
    if (last === prev) return "No change this month"
    const pct = prev === 0 ? (last > 0 ? 100 : 0) : Math.abs(((last - prev) / prev) * 100)
    const dir = last >= prev ? "up" : "down"
    const formatted = pct.toFixed(1).replace(/\.0$/, "")
    return `Trending ${dir} by ${formatted}% this month`
  }

  const hoursTrend = trendString(hoursData, hoursData.map((d) => d.hours))
  const joinedTrend = trendString(joinedData, joinedData.map((d) => d.joined))
  // Unrated past events for rating
  const [unrated, setUnrated] = React.useState<Array<{ id: string; title: string; org: string; when: string }>>([])
  React.useEffect(() => {
    fetch(`/api/user/unrated-events`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setUnrated((json?.data ?? []) as Array<{ id: string; title: string; org: string; when: string }>)
      })
      .catch(() => {})
  }, [])
  const [savingRating, setSavingRating] = React.useState<string | null>(null)
  const [comments, setComments] = React.useState<Record<string, string>>({})
  const [hover, setHover] = React.useState<{ id: string; value: number } | null>(null)
  async function submitRating(eventId: string, rating: number) {
    try {
      setSavingRating(eventId)
      const res = await fetch(`/api/user/events/${encodeURIComponent(eventId)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: (comments[eventId] || "").trim() || undefined }),
      })
      if (!res.ok) return
      setUnrated((prev) => prev.filter((e) => e.id !== eventId))
      setComments((prev) => {
        const next = { ...prev }
        delete next[eventId]
        return next
      })
    } finally {
      setSavingRating(null)
    }
  }
  // messages moved to lazy section

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
        <ChartBarSingle
          title="Hours"
          description="Hours logged"
          data={hoursData}
          dataKey="hours"
          label="Hours"
          colorVar="var(--chart-1)"
          xKey="month"
          xTickFormatter={(v) => String(v)}
          footerPrimary={hoursTrend || undefined}
          footerSecondary={footerRange(hoursData)}
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
          footerPrimary={joinedTrend || undefined}
          footerSecondary={footerRange(joinedData)}
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
              const total = orgNoData ? 0 : orgPieData.reduce((sum, s) => sum + s.count, 0)
              const top = [...orgPieData].sort((a, b) => b.count - a.count).slice(0, 3)
              return (
                <ul className="grid gap-1 text-xs min-w-[10rem]">
                  {orgNoData ? (
                    <li className="flex w-full items-center gap-2 whitespace-nowrap">
                      <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
                      <span className="truncate text-foreground/80">None</span>
                      <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">0%</span>
                    </li>
                  ) : (
                    top.map((s) => {
                      const pct = total ? Math.round((s.count / total) * 100) : 0
                      return (
                        <li key={s.org} className="flex w-full items-center gap-2 whitespace-nowrap">
                          <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: s.fill as string }} />
                          <span className="truncate text-foreground/80">{s.org}</span>
                          <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
                        </li>
                      )
                    })
                  )}
                </ul>
              )
            })()}
          </CardContent>
          <div className="px-3 pb-2 text-[11px] text-muted-foreground">Breakdown of your shifts by organization (last 6 months)</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming joined (lazy + Suspense) */}
        <Card className="lg:col-span-2">
          <React.Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading upcoming opportunities…</div>}>
            <UpcomingJoinedSection />
          </React.Suspense>
        </Card>

        {/* Messages preview (lazy + Suspense, with extra horizontal padding) */}
        <Card>
          <React.Suspense fallback={<div className="px-4 py-3 text-sm text-muted-foreground">Loading messages…</div>}>
            <MessagesPreviewSection className="px-3" />
          </React.Suspense>
        </Card>
      </div>

      {/* Rate past events */}
      <Card>
        <CardContent className="space-y-1.5 p-3">
          {unrated.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <IconCalendar className="size-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">No events to rate right now.</div>
            </div>
          ) : (
            <>
              <div className="text-sm font-medium">Rate your recent events</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {unrated.slice(0,3).map((ev) => (
                  <div key={ev.id} className="rounded-md border p-3 hover:shadow-sm transition" onMouseLeave={() => setHover(null)}>
                    <div className="truncate font-medium">{ev.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{ev.org}</div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <IconCalendar className="size-4" />
                      <span>{fmt(ev.when)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => submitRating(ev.id, star)}
                          disabled={savingRating === ev.id}
                          onMouseEnter={() => setHover({ id: ev.id, value: star })}
                          className={`h-8 w-8 rounded text-base ${
                            hover && hover.id === ev.id && star <= hover.value ? "text-yellow-500" : "text-gray-400"
                          } ${savingRating === ev.id ? "opacity-50" : "hover:text-yellow-500"}`}
                          title={`${star} star${star>1?"s":""}`}
                          aria-label={`${star} star${star>1?"s":""}`}
                        >
                          {"★"}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <textarea
                        className="w-full resize-none rounded-md border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        rows={2}
                        placeholder="Optional comment (visible to the organization)"
                        value={comments[ev.id] || ""}
                        onChange={(e) => setComments((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
