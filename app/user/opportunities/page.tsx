"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Filters } from "./components/Filters"
import { ResultsGrid } from "./components/ResultsGrid"
import type { Opportunity } from "./components/types"

// moved to components/types

export default function Page() {
  const [items, setItems] = React.useState<Opportunity[]>([])
  const [loading, setLoading] = React.useState(true)

  const [query, setQuery] = React.useState("")
  const [timeCommit, setTimeCommit] = React.useState("any")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  // Multi-select specialties. Empty = Any
  const [selectedSpecs, setSelectedSpecs] = React.useState<string[]>([])
  // Select-based combobox (no extra state needed)

  // Fetch from API whenever basic filters change (server-side filters)
  React.useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    // Specialty filter is client-side
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (timeCommit) params.set("timeCommit", timeCommit)
    fetch(`/api/user/opportunities?${params.toString()}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setItems((json?.data ?? []) as Opportunity[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [query, from, to, timeCommit])

  // Specialties options derived from events' skills
  const categoryOptions = React.useMemo(() => {
    const s = new Set<string>()
    for (const it of items) {
      for (const sp of it.skills ?? []) {
        const v = String(sp).trim()
        if (v) s.add(v)
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [items])

  const filtered = React.useMemo(() => {
    return items.filter((o) => {
      const q = query.trim().toLowerCase()
      if (q && !(o.title.toLowerCase().includes(q) || o.org.toLowerCase().includes(q) || (o.teaser ?? "").toLowerCase().includes(q))) return false
      if (selectedSpecs.length > 0 && !(o.skills ?? []).some((s) => selectedSpecs.includes(s))) return false
      if (from && new Date(o.start) < new Date(from)) return false
      if (to && new Date(o.start) > new Date(to)) return false
      const durH = o.hours ?? (o.end ? (new Date(o.end).getTime() - new Date(o.start).getTime())/3600000 : undefined)
      if (timeCommit === "short" && durH !== undefined && durH > 2) return false
      if (timeCommit === "halfday" && durH !== undefined && durH > 5) return false
      return true
    })
  }, [items, query, selectedSpecs, from, to, timeCommit])

  return (
    <main className="p-4 space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <Filters
            query={query}
            setQuery={setQuery}
            timeCommit={timeCommit}
            setTimeCommit={setTimeCommit}
            from={from}
            setFrom={setFrom}
            to={to}
            setTo={setTo}
            selectedSpecs={selectedSpecs}
            setSelectedSpecs={setSelectedSpecs}
            categoryOptions={categoryOptions}
          />
        </CardContent>
      </Card>
      {/* Results */}
      <ResultsGrid items={filtered} loading={loading} />
    </main>
  )
}
