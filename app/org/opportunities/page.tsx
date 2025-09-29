"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconCalendar, IconPencil } from "@tabler/icons-react"

function formatFriendly(iso: string): { full: string; relative: string } {
  const d = new Date(iso)
  const full = d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const relative = diffDays === 0 ? "today" : diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`
  return { full, relative }
}

type EventItem = {
  id: string
  title: string
  shortDescription?: string | null
  startsAt: string
  volunteersNeeded: number
  attachments?: string[]
  specialties?: string[]
  // Optional fields that may exist server-side; used for status tracker display
  signedUpCount?: number
  completedCount?: number
  hoursLogged?: number
}

const SKILL_OPTIONS = [
  "Environmental Science",
  "Public Health",
  "Computer Science",
  "Business",
  "Education",
  "Biology",
  "Mechanical Engineering",
  "Nursing",
]

export default function Page() {
  const [title, setTitle] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [datetime, setDatetime] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [volunteers, setVolunteers] = React.useState<number | "">("")
  const [skills, setSkills] = React.useState<string[]>([])
  const [skillsOpen, setSkillsOpen] = React.useState(false)
  const [skillsQuery, setSkillsQuery] = React.useState("")
  const [files, setFiles] = React.useState<File[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [events, setEvents] = React.useState<EventItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const resetForm = () => {
    setTitle("")
    setDesc("")
    setDatetime("")
    setLocation("")
    setVolunteers("")
    setSkills([])
    setFiles([])
    setEditingId(null)
  }

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/org/events", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load events")
        const data = (await res.json()) as EventItem[]
        if (mounted) setEvents(data.length > 0 ? data : getPlaceholders())
      } catch {
        // If API not implemented yet, show placeholders
        if (mounted) setEvents(getPlaceholders())
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  function getPlaceholders(): EventItem[] {
    return [
      {
        id: "ph-1",
        title: "Community Park Cleanup",
        shortDescription: "Help clean up litter and beautify the local park.",
        startsAt: "2025-11-20T10:00:00.000Z",
        volunteersNeeded: 15,
        specialties: ["Environmental Science"],
        signedUpCount: 9,
        completedCount: 0,
        hoursLogged: 0,
      },
      {
        id: "ph-2",
        title: "Food Bank Sorting",
        shortDescription: "Sort and package donated food for families in need.",
        startsAt: "2025-08-10T14:00:00.000Z",
        volunteersNeeded: 10,
        specialties: ["Public Health", "Education"],
        signedUpCount: 12,
        completedCount: 10,
        hoursLogged: 40,
      },
      {
        id: "ph-3",
        title: "After-School Tutoring",
        shortDescription: "Tutor middle school students in math and reading.",
        startsAt: "2025-07-01T21:00:00.000Z",
        volunteersNeeded: 8,
        specialties: ["Education"],
        signedUpCount: 8,
        completedCount: 8,
        hoursLogged: 24,
      },
    ]
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title || !datetime || !volunteers) return
    try {
      setSubmitting(true)
      const fd = new FormData()
      fd.append("title", title)
      // include location in description until a dedicated field exists server-side
      const composedDesc = location ? `${desc}\n\nLocation: ${location}` : desc
      fd.append("shortDescription", composedDesc)
      fd.append("startsAt", new Date(datetime).toISOString())
      fd.append("volunteersNeeded", String(volunteers))
      fd.append("specialties", JSON.stringify(skills))
      for (const f of files) fd.append("attachments", f, f.name)

      const res = await fetch("/api/org/events", { method: editingId ? "PUT" : "POST", body: fd })
      if (!res.ok) throw new Error("Failed to save event")
      // Optimistically refresh list
      const listRes = await fetch("/api/org/events", { cache: "no-store" })
      if (listRes.ok) setEvents((await listRes.json()) as EventItem[])
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(ev: EventItem) {
    setEditingId(ev.id)
    setTitle(ev.title)
    setDesc(ev.shortDescription ?? "")
    setDatetime(ev.startsAt ? new Date(ev.startsAt).toISOString().slice(0, 16) : "")
    setVolunteers(ev.volunteersNeeded)
    setSkills(ev.specialties ?? [])
    setLocation("")
    setFiles([])
  }

  // Removed duplicate/archive actions per request

  const nowIso = new Date().toISOString()
  const upcoming = events.filter((e) => e.startsAt >= nowIso)
  const past = events.filter((e) => e.startsAt < nowIso)

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Create / Edit Opportunity */}
        <Card>
          <CardContent className="pt-4">
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Campus Cleanup Day" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <textarea
                id="desc"
                value={desc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)}
                placeholder="Brief description of the opportunity"
                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="datetime">Date & time</Label>
              <Input id="datetime" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. City Park" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volunteers">Volunteers needed</Label>
              <Input id="volunteers" type="number" min={1} value={volunteers} onChange={(e) => setVolunteers(e.target.value ? Number(e.target.value) : "")} placeholder="e.g. 10" required />
            </div>
            <div className="space-y-2">
              <Label>Skills required (optional)</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  type="button"
                  onClick={() => setSkillsOpen((o) => !o)}
                >
                  <span className="truncate">
                    {skills.length > 0 ? `${skills.length} selected` : "Select skills"}
                  </span>
                  <svg className={`ml-2 size-4 transition ${skillsOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"/></svg>
                </Button>
                {skillsOpen && (
                  <div className="absolute z-20 mt-2 w-full rounded-md border bg-popover p-2 shadow-md">
                    <div className="mb-2 flex items-center gap-2">
                      <Input
                        placeholder="Search skills..."
                        className="h-8 flex-1"
                        value={skillsQuery}
                        onChange={(e) => setSkillsQuery(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSkills([...SKILL_OPTIONS])}
                      >
                        Select all
                      </Button>
                    </div>
                    <div className="max-h-56 overflow-auto">
                      {SKILL_OPTIONS.filter((opt) => opt.toLowerCase().includes(skillsQuery.toLowerCase())).map((opt) => {
                        const active = skills.includes(opt)
                        return (
                          <button
                            type="button"
                            key={opt}
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-accent"
                            onClick={() => {
                              setSkills((prev) => (prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]))
                            }}
                          >
                            <span className={`size-2 rounded-sm border ${active ? "bg-primary" : "bg-transparent"}`} />
                            <span>{opt}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* Removed badges summary per request */}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Upload flyer or image</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const list = e.target.files
                  if (!list) return
                  setFiles(Array.from(list))
                }}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={submitting || !title || !datetime || !volunteers}>
                {editingId ? (submitting ? "Saving..." : "Save Changes") : submitting ? "Creating..." : "Create Opportunity"}
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>

        {/* Manage Opportunities */}
        <Card>
          <CardContent className="space-y-6 pt-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Upcoming</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming opportunities yet.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {upcoming.map((ev) => (
                  <li key={ev.id} className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center md:gap-x-6 p-5 rounded-md hover:bg-muted/50 hover:ring-1 hover:ring-border transition">
                    <div className="md:col-span-4 space-y-1.5">
                      <div className="text-base font-medium">{ev.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{ev.shortDescription || "—"}</div>
                    </div>
                    <div className="md:col-span-6 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCalendar className="size-4" />
                        <span>{formatFriendly(ev.startsAt).full}</span>
                        <span className="text-xs text-muted-foreground">• {formatFriendly(ev.startsAt).relative}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const pct = Math.min(100, Math.round(((ev.signedUpCount ?? 0) / Math.max(1, ev.volunteersNeeded)) * 100))
                          return (
                            <div className="h-2 w-40 rounded bg-muted">
                              <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          )
                        })()}
                        <span className="text-xs text-muted-foreground">{ev.signedUpCount ?? 0}/{ev.volunteersNeeded}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => startEdit(ev)}>
                        <IconPencil className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Past</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : past.length === 0 ? (
              <p className="text-sm text-muted-foreground">No past opportunities yet.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {past.map((ev) => (
                  <li key={ev.id} className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center md:gap-x-6 p-5 rounded-md hover:bg-muted/50 hover:ring-1 hover:ring-border transition">
                    <div className="md:col-span-4 space-y-1.5">
                      <div className="text-base font-medium">{ev.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{ev.shortDescription || "—"}</div>
                    </div>
                    <div className="md:col-span-6 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCalendar className="size-4" />
                        <span>{formatFriendly(ev.startsAt).full}</span>
                        <span className="text-xs text-muted-foreground">• {formatFriendly(ev.startsAt).relative}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const pct = Math.min(100, Math.round(((ev.signedUpCount ?? 0) / Math.max(1, ev.volunteersNeeded)) * 100))
                          return (
                            <div className="h-2 w-40 rounded bg-muted">
                              <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          )
                        })()}
                        <span className="text-xs text-muted-foreground">{ev.signedUpCount ?? 0}/{ev.volunteersNeeded}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => startEdit(ev)}>
                        <IconPencil className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
