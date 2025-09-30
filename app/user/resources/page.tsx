"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { IconFileText, IconExternalLink, IconVideo } from "@tabler/icons-react"

type Resource = {
  id: string
  title: string
  kind: "pdf" | "link" | "video"
  description: string
  updated: string // ISO date
  tags: string[]
  size?: string // e.g., "1.2 MB"
  duration?: string // e.g., "4:32"
  url: string
}

const data: Resource[] = [
  {
    id: "r1",
    title: "Volunteer Handbook",
    kind: "pdf",
    description: "Guidelines, expectations, and safety information for volunteers.",
    updated: "2025-09-20",
    tags: ["Onboarding", "Safety"],
    size: "1.1 MB",
    url: "/docs/volunteer-handbook.pdf",
  },
  {
    id: "r2",
    title: "CampusReach Overview",
    kind: "link",
    description: "Learn how CampusReach connects students with local opportunities.",
    updated: "2025-09-10",
    tags: ["About", "Programs"],
    url: "https://campusreach.example.com/overview",
  },
  {
    id: "r3",
    title: "Orientation Video",
    kind: "video",
    description: "Quick start guide for first-time volunteers.",
    updated: "2025-09-05",
    tags: ["Onboarding", "Tutorial"],
    duration: "4:12",
    url: "https://videos.example.com/orientation",
  },
]

export default function Page() {
  const [query, setQuery] = React.useState("")
  const [kind, setKind] = React.useState<"all" | Resource["kind"]>("all")
  const [tag, setTag] = React.useState("all")

  const tags = React.useMemo(() => {
    const set = new Set<string>()
    data.forEach((r) => r.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [])

  const filtered = React.useMemo(() => {
    return data.filter((r) => {
      const q = query.trim().toLowerCase()
      if (q && !(r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))) return false
      if (kind !== "all" && r.kind !== kind) return false
      if (tag !== "all" && !r.tags.includes(tag)) return false
      return true
    })
  }, [query, kind, tag])

  const iconFor = (k: Resource["kind"]) => {
    switch (k) {
      case "pdf":
        return <IconFileText className="size-4" />
      case "video":
        return <IconVideo className="size-4" />
      default:
        return <IconExternalLink className="size-4" />
    }
  }

  return (
    <main className="p-4 space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:items-end">
            <div className="md:col-span-3">
              <Label htmlFor="q" className="text-xs">Search</Label>
              <Input id="q" placeholder="Search resources" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="kind" className="text-xs">Type</Label>
              <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as "all" | "pdf" | "link" | "video")} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                <option value="all">All</option>
                <option value="pdf">PDF</option>
                <option value="link">Link</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="tag" className="text-xs">Tag</Label>
              <select id="tag" value={tag} onChange={(e) => setTag(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                <option value="all">All</option>
                {tags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {iconFor(r.kind)}
                    <div className="truncate font-medium">{r.title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Updated {new Date(r.updated).toLocaleDateString()}</div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground">
                  {r.kind === "pdf" && r.size ? <div>{r.size}</div> : null}
                  {r.kind === "video" && r.duration ? <div>{r.duration}</div> : null}
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                {r.kind === "pdf" ? (
                  <Button size="sm" variant="outline" disabled title="Temporarily disabled">
                    Download
                  </Button>
                ) : null}
                <Button size="sm" disabled title="Temporarily disabled">
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
