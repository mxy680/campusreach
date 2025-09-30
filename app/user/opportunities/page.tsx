"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { IconCalendar, IconMapPin, IconUsers, IconClock } from "@tabler/icons-react"

type Opportunity = {
  id: string
  title: string
  org: string
  teaser: string
  start: string // ISO
  end?: string // ISO
  location: string
  need: number
  joined: number
  categories: string[]
  skills: string[]
  pointsPerHour?: number
}

const sample: Opportunity[] = [
  {
    id: "o1",
    title: "STEM Tutor (Middle School)",
    org: "BrightKids",
    teaser: "Help students with math and science homework.",
    start: "2025-10-05T20:00:00.000Z",
    end: "2025-10-05T22:00:00.000Z",
    location: "Civic Library",
    need: 8,
    joined: 3,
    categories: ["Education"],
    skills: ["Tutoring", "STEM"],
    pointsPerHour: 3,
  },
  {
    id: "o2",
    title: "Park Cleanup Weekend",
    org: "City Parks",
    teaser: "Join us to keep our park beautiful.",
    start: "2025-10-12T14:00:00.000Z",
    location: "Riverfront Park",
    need: 25,
    joined: 7,
    categories: ["Environment"],
    skills: ["Teamwork"],
    pointsPerHour: 2,
  },
  {
    id: "o3",
    title: "Senior Tech Help Night",
    org: "Community Center",
    teaser: "Assist seniors with phones and laptops.",
    start: "2025-10-07T23:00:00.000Z",
    location: "Maple Center",
    need: 6,
    joined: 2,
    categories: ["Community"],
    skills: ["Tech Support", "Patience"],
    pointsPerHour: 3,
  },
]

export default function Page() {
  const [query, setQuery] = React.useState("")
  const [radius, setRadius] = React.useState(10)
  const [timeCommit, setTimeCommit] = React.useState("any")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [category, setCategory] = React.useState("any")
  const [skillMatch, setSkillMatch] = React.useState(false)

  const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })

  const filtered = React.useMemo(() => {
    return sample.filter((o) => {
      const q = query.trim().toLowerCase()
      if (q && !(o.title.toLowerCase().includes(q) || o.org.toLowerCase().includes(q) || o.teaser.toLowerCase().includes(q))) return false
      if (category !== "any" && !o.categories.includes(category)) return false
      if (from && new Date(o.start) < new Date(from)) return false
      if (to && new Date(o.start) > new Date(to)) return false
      if (timeCommit === "short" && (o.end ? (new Date(o.end).getTime() - new Date(o.start).getTime())/3600000 > 2 : false)) return false
      if (timeCommit === "halfday" && (o.end ? (new Date(o.end).getTime() - new Date(o.start).getTime())/3600000 > 5 : false)) return false
      // radius and skillMatch are placeholders in this mock
      if (skillMatch) {
        // pretend the user has skills: ["Tutoring", "Teamwork"]
        const userSkills = new Set(["Tutoring", "Teamwork"]) 
        const overlap = o.skills.some((s) => userSkills.has(s))
        if (!overlap) return false
      }
      return true
    })
  }, [query, category, from, to, timeCommit, skillMatch])

  return (
    <main className="p-4 space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:items-end">
            <div className="md:col-span-2">
              <Label htmlFor="q" className="text-xs">Search</Label>
              <Input id="q" placeholder="Search by title, org, or keyword" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="commit" className="text-xs">Time commitment</Label>
              <select id="commit" value={timeCommit} onChange={(e) => setTimeCommit(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                <option value="any">Any</option>
                <option value="short">Short (&lt;=2h)</option>
                <option value="halfday">Half day (&lt;=5h)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="category" className="text-xs">Category</Label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                <option value="any">Any</option>
                <option value="Education">Education</option>
                <option value="Environment">Environment</option>
                <option value="Community">Community</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="radius" className="text-xs">Radius: <span className="text-muted-foreground">{radius} mi</span></Label>
                <input id="radius" type="range" min={1} max={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded bg-muted" />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={skillMatch} onChange={(e) => setSkillMatch(e.target.checked)} className="h-3.5 w-3.5" />
                Match my skills
              </label>
              <Button variant="outline" size="sm" onClick={() => { setQuery(""); setTimeCommit("any"); setFrom(""); setTo(""); setCategory("any"); setRadius(10); setSkillMatch(false); }}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((o) => (
          <Card key={o.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{o.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{o.org}</div>
                </div>
                {o.pointsPerHour ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{o.pointsPerHour} pts/hr</span>
                ) : null}
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">{o.teaser}</p>

              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><IconCalendar className="size-4" /><span>{fmt(o.start)}{o.end ? ` — ${fmt(o.end)}` : ""}</span></div>
                <div className="flex items-center gap-2"><IconMapPin className="size-4" /><span>{o.location}</span></div>
                <div className="flex items-center gap-2"><IconUsers className="size-4" /><span>{o.joined}/{o.need} volunteers</span></div>
                <div className="flex items-center gap-2"><IconClock className="size-4" /><span>{o.end ? `${Math.round((new Date(o.end).getTime() - new Date(o.start).getTime())/3600000)} hrs` : "Flexible"}</span></div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {o.categories.map((c) => (
                  <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>
                ))}
                {o.skills.map((s) => (
                  <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                {(() => {
                  const pct = Math.min(100, Math.round((o.joined / Math.max(1, o.need)) * 100))
                  return (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  )
                })()}
                <div className="flex items-center gap-2">
                  <Button size="sm" asChild>
                    <a href={`/user/opportunities/${o.id}`}>Sign up</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/user/messaging">Contact</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
