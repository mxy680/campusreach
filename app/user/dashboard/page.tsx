"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCalendar, IconMessage2 } from "@tabler/icons-react"
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
  const [upcomingJoined, setUpcomingJoined] = React.useState<Opportunity[]>([])
  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/upcoming?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const rows = (json?.data ?? []) as Opportunity[]
        setUpcomingJoined(rows)
      })
      .catch(() => {})
  }, [userEmail])
  const [suggested, setSuggested] = React.useState<Opportunity[]>([])
  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/suggested?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setSuggested((json?.data ?? []) as Opportunity[])
      })
      .catch(() => {})
  }, [userEmail])
  const [messages, setMessages] = React.useState<{ id: string; from: string; subject: string; date: string }[]>([])
  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/messages?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setMessages((json?.data ?? []) as typeof messages)
      })
      .catch(() => {})
  }, [userEmail])

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
        {/* Upcoming joined */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-1.5">
            {upcomingJoined.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <IconCalendar className="size-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">No upcoming shifts yet. Explore and sign up to see them here.</div>
                <Button size="sm" asChild>
                  <a href="/user/opportunities">Browse opportunities</a>
                </Button>
              </div>
            ) : (
              <>
                <div className="text-sm font-medium">Your upcoming opportunities</div>
                <ul className="divide-y rounded-md border">
                {upcomingJoined.map((ev) => (
                  <li key={ev.id} className="grid grid-cols-1 gap-3 p-2 md:grid-cols-12 md:items-center">
                    <div className="md:col-span-6 min-w-0">
                      <div className="truncate font-medium">{ev.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{ev.org} • {ev.location}</div>
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCalendar className="size-4" />
                        <span>{fmt(ev.when)}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {(() => {
                          const pct = Math.min(100, Math.round((ev.joined / Math.max(1, ev.need)) * 100))
                          return (
                            <div className="h-1.5 w-40 rounded bg-muted">
                              <div className="h-1.5 rounded bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          )
                        })()}
                        <span className="text-xs text-muted-foreground">{ev.joined}/{ev.need}</span>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-7 px-3" asChild>
                        <a href={`/user/opportunities`}>Details</a>
                      </Button>
                    </div>
                  </li>
                ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {/* Messages preview */}
        <Card>
          <CardContent className="space-y-1.5 p-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <IconMessage2 className="size-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">No messages yet.</div>
                <Button size="sm" asChild>
                  <a href="/user/messaging">Send a message</a>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Messages</div>
                  <Button size="sm" variant="ghost" asChild>
                    <a href="/user/messaging">See all</a>
                  </Button>
                </div>
                <ul className="divide-y rounded-md border">
                  {messages.map((m) => (
                    <li key={m.id} className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{m.from}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{m.subject}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suggested opportunities */}
      <Card>
        <CardContent className="space-y-1.5 p-3">
          {suggested.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <IconCalendar className="size-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">No suggestions yet. Check back soon.</div>
              <Button size="sm" asChild>
                <a href="/user/opportunities">Browse all</a>
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
