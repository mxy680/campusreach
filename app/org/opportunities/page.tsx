"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconCalendar, IconPencil, IconMapPin } from "@tabler/icons-react"
import { IconTrash } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

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

function splitDesc(desc?: string | null): { body: string; location?: string } {
  if (!desc) return { body: "" }
  const m = /Location:\s*([^\n]+)/i.exec(desc)
  const location = m?.[1]?.trim()
  const body = desc.replace(/Location:\s*[^\n]+/i, "").trim()
  return { body, location }
}

type EventItem = {
  id: string
  title: string
  shortDescription?: string | null
  startsAt: string
  volunteersNeeded: number
  attachments?: string[]
  specialties?: string[]
  notes?: string | null
  timeCommitmentHours?: number | null
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
  const [timeCommitmentNote, setTimeCommitmentNote] = React.useState("")
  const [timeCommitmentHours, setTimeCommitmentHours] = React.useState<number | "">("")
  const [skills, setSkills] = React.useState<string[]>([])
  const [skillsOpen, setSkillsOpen] = React.useState(false)
  const [skillsQuery, setSkillsQuery] = React.useState("")
  const [files, setFiles] = React.useState<File[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [events, setEvents] = React.useState<EventItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  // Show dev-only helpers based on public flags only (build-mode independent)
  // Set NEXT_PUBLIC_SHOW_AUTOFILL=true or NEXT_PUBLIC_NODE_ENV=dev to enable
  const publicEnv = (process.env.NEXT_PUBLIC_NODE_ENV || "").toLowerCase()
  const showDevTools = publicEnv === "dev" || ["1", "true", "yes"].includes(String(process.env.NEXT_PUBLIC_SHOW_AUTOFILL || "").toLowerCase())

  // Helper to produce a datetime-local compatible string in local time
  const toLocalInput = React.useCallback((date: Date) => {
    const tz = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - tz).toISOString().slice(0, 16)
  }, [])

  // Dev helper: autofill the form with a sample event
  function autofillSample() {
    const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    setTitle("Campus Cleanup Day")
    setDesc("Help clean up the campus and surrounding areas.\nBring gloves and water.")
    setDatetime(toLocalInput(inSevenDays))
    setLocation("Times Square")
    setVolunteers(8)
    setTimeCommitmentHours(3)
    setTimeCommitmentNote("~3 hours; flexible shifts available.")
    setSkills(["Environmental Science", "Public Health"])
  }

  const resetForm = () => {
    setTitle("")
    setDesc("")
    setDatetime("")
    setLocation("")
    setVolunteers("")
    setTimeCommitmentNote("")
    setTimeCommitmentHours("")
    setSkills([])
    setFiles([])
    setEditingId(null)
  }

  React.useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          const res = await fetch("/api/org/events", { cache: "no-store" })
          if (!res.ok) throw new Error("Failed to load events")
          const data = (await res.json()) as EventItem[]
          if (mounted) setEvents(Array.isArray(data) ? data : [])
        } catch {
          if (mounted) setEvents([])
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  // Removed placeholder generator to ensure only DB-backed events appear

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
      if (timeCommitmentNote.trim()) fd.append("notes", timeCommitmentNote.trim())
      if (timeCommitmentHours !== "" && !Number.isNaN(timeCommitmentHours)) fd.append("timeCommitmentHours", String(timeCommitmentHours))
      fd.append("specialties", JSON.stringify(skills))
      for (const f of files) fd.append("attachments", f, f.name)
      if (editingId) fd.append("id", editingId)

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
    setDatetime(ev.startsAt ? toLocalInput(new Date(ev.startsAt)) : "")
    setVolunteers(ev.volunteersNeeded)
    setTimeCommitmentNote(ev.notes ?? "")
    setTimeCommitmentHours(typeof ev.timeCommitmentHours === "number" ? ev.timeCommitmentHours : "")
    setSkills(ev.specialties ?? [])
    setLocation("")
    setFiles([])
  }

  // Removed duplicate/archive actions per request

  const nowIso = new Date().toISOString()
  const upcoming = events.filter((e) => e.startsAt >= nowIso)
  const past = events.filter((e) => e.startsAt < nowIso)

  async function deleteEvent(id: string) {
    try {
      const res = await fetch(`/api/org/events?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete event")
        return
      }
      const listRes = await fetch("/api/org/events", { cache: "no-store" })
      if (listRes.ok) setEvents(await listRes.json())
      toast.success("Event deleted")
    } catch {
      toast.error("Failed to delete event")
    }
  }

  return (
    <main className="p-6 min-h-screen">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Create / Edit Opportunity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Create opportunity</CardTitle>
            <CardDescription>Publish a new opportunity for students to join</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSubmit}>
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
                <Label htmlFor="timeCommitmentHours">Time commitment hours (optional)</Label>
                <Input
                  id="timeCommitmentHours"
                  type="number"
                  min={0}
                  step={0.5}
                  value={timeCommitmentHours}
                  onChange={(e) => setTimeCommitmentHours(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={timeCommitmentNote}
                  onChange={(e) => setTimeCommitmentNote(e.target.value)}
                  placeholder="e.g. flexible scheduling, ongoing weekly, etc."
                />
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
                    <svg className={`ml-2 size-4 transition ${skillsOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" /></svg>
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

              <div className="space-y-2">
                <Label>Upload flyer, image, or document</Label>
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  onChange={(e) => {
                    const list = e.target.files
                    if (!list) return
                    const picked = Array.from(list)
                    setFiles((prev) => {
                      const map = new Map<string, File>(prev.map((f) => [f.name + f.size, f]))
                      for (const f of picked) map.set(f.name + f.size, f)
                      return Array.from(map.values())
                    })
                  }}
                />
                {files.length > 0 && (
                  <div className="mt-2">
                    <div className="mb-1 text-xs font-medium text-foreground">Selected attachments</div>
                    <div className="flex flex-wrap gap-2">
                      {files.map((f, i) => {
                        const name = f.name
                        const lower = name.toLowerCase()
                        const isImg = [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) => lower.endsWith(ext))
                        if (isImg) {
                          const url = URL.createObjectURL(f)
                          return (
                            <div key={i} className="relative">
                              <Image
                                src={url}
                                alt={name}
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded border object-cover"
                                unoptimized
                                onLoadingComplete={() => URL.revokeObjectURL(url)}
                              />
                              <div className="mt-1 max-w-[80px] truncate text-[10px] text-muted-foreground" title={name}>{name}</div>
                            </div>
                          )
                        }
                        return (
                          <div key={i} className="inline-flex items-center gap-2 rounded border bg-muted/40 px-2 py-1 text-xs">
                            <span className="inline-block size-2 rounded-full bg-primary/70" aria-hidden />
                            <span className="truncate max-w-[200px]" title={name}>{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-1">
                {showDevTools && (
                  <Button type="button" variant="outline" onClick={autofillSample} disabled={submitting}>
                    Autofill sample
                  </Button>
                )}
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your opportunities</CardTitle>
            <CardDescription>Manage upcoming and past opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Upcoming</h3>
              {loading ? (
                <ul className="space-y-1.5">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="p-2.5 rounded-xl border">
                      <div className="grid grid-cols-12 items-center gap-3">
                        <div className="col-span-6 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="col-span-4 space-y-2">
                          <Skeleton className="h-3 w-36 ml-auto" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Skeleton className="h-6 w-6 rounded" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming opportunities yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {upcoming.map((ev) => {
                    const { location } = splitDesc(ev.shortDescription)
                    return (
                      <li key={ev.id} className="grid grid-cols-1 gap-1 md:grid-cols-12 md:items-center md:gap-x-3 p-2.5 rounded-xl border bg-card hover:shadow-sm transition h-20">
                        <div className="md:col-span-6 space-y-1.5 min-w-0">
                          <div className="truncate text-[14px] font-semibold leading-4">{ev.title}</div>
                          {location && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <IconMapPin className="size-3" />
                              <span className="truncate">{location}</span>
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-4 flex flex-col items-center justify-center space-y-2 text-center">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground justify-center">
                            <IconCalendar className="size-3" />
                            <span>{formatFriendly(ev.startsAt).full}</span>
                          </div>
                          <div className="flex items-center gap-3 justify-center w-full max-w-[240px]">
                            {(() => {
                              const pct = Math.min(100, Math.round(((ev.signedUpCount ?? 0) / Math.max(1, ev.volunteersNeeded)) * 100))
                              return (
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-primary/90" style={{ width: `${pct}%` }} />
                                </div>
                              )
                            })()}
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{ev.signedUpCount ?? 0}/{ev.volunteersNeeded}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Edit"
                            onClick={() => startEdit(ev)}
                          >
                            <IconPencil className="size-3" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                aria-label="Delete"
                              >
                                <IconTrash className="size-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[380px]">
                              <DialogHeader>
                                <DialogTitle>Delete this event?</DialogTitle>
                                <DialogDescription>This action cannot be undone.</DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">Cancel</Button>
                                </DialogTrigger>
                                <Button variant="destructive" size="sm" onClick={() => deleteEvent(ev.id)}>Delete</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <div className="h-px bg-border" />
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Past</h3>
              {loading ? (
                <ul className="space-y-1.5">
                  {[0, 1].map((i) => (
                    <li key={i} className="p-2.5 rounded-xl border">
                      <div className="grid grid-cols-12 items-center gap-3">
                        <div className="col-span-6 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="col-span-4 space-y-2">
                          <Skeleton className="h-3 w-36 ml-auto" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Skeleton className="h-6 w-6 rounded" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : past.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past opportunities yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {past.map((ev) => {
                    const { location } = splitDesc(ev.shortDescription)
                    return (
                      <li key={ev.id} className="grid grid-cols-1 gap-1 md:grid-cols-12 md:items-center md:gap-x-3 p-2.5 rounded-xl border bg-card hover:shadow-sm transition h-20">
                        <div className="md:col-span-6 space-y-1.5 min-w-0">
                          <div className="truncate text-[14px] font-semibold leading-4">{ev.title}</div>
                          {location && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <IconMapPin className="size-3" />
                              <span className="truncate">{location}</span>
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-4 flex flex-col items-center justify-center space-y-2 text-center">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground justify-center">
                            <IconCalendar className="size-3" />
                            <span>{formatFriendly(ev.startsAt).full}</span>
                          </div>
                          <div className="flex items-center gap-3 justify-center w-full max-w-[240px]">
                            {(() => {
                              const pct = Math.min(100, Math.round(((ev.signedUpCount ?? 0) / Math.max(1, ev.volunteersNeeded)) * 100))
                              return (
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-primary/90" style={{ width: `${pct}%` }} />
                                </div>
                              )
                            })()}
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{ev.signedUpCount ?? 0}/{ev.volunteersNeeded}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Edit"
                            onClick={() => startEdit(ev)}
                          >
                            <IconPencil className="size-3" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                aria-label="Delete"
                              >
                                <IconTrash className="size-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[380px]">
                              <DialogHeader>
                                <DialogTitle>Delete this event?</DialogTitle>
                                <DialogDescription>This action cannot be undone.</DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">Cancel</Button>
                                </DialogTrigger>
                                <Button variant="destructive" size="sm" onClick={() => deleteEvent(ev.id)}>Delete</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}