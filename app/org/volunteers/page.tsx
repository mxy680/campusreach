"use client"

import * as React from "react"
import { DataTable, schema } from "../components/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Page() {
  const isMobile = useIsMobile()
  const [eventId, setEventId] = React.useState<string | null>(null)
  const [eventOptions, setEventOptions] = React.useState<{ id: string; label: string }[]>([])
  const [rows, setRows] = React.useState<Array<import("zod").z.infer<typeof schema>>>([])
  const [ready, setReady] = React.useState(false)
  const [skeletonVisible, setSkeletonVisible] = React.useState(false)
  // Restore persisted selected event
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/org/events-list", { cache: "no-store" })
        if (!res.ok) throw new Error("events list")
        const json = await res.json()
        const opts = (json?.data ?? []) as { id: string; label: string }[]
        if (!mounted) return
        setEventOptions(opts)
        const saved = localStorage.getItem("org:volunteers:selectedEvent")
        const initial = saved && opts.find((o) => o.id === saved) ? saved : opts[0]?.id
        setEventId(initial ?? null)
      } finally {
        if (mounted) setReady(true)
      }
    })()
    return () => { mounted = false }
  }, [])
  // Persist on change
  React.useEffect(() => {
    if (!eventId) return
    try {
      localStorage.setItem("org:volunteers:selectedEvent", eventId)
    } catch { }
  }, [eventId])
  // Load rows when event changes
  React.useEffect(() => {
    if (!eventId) return
    let mounted = true
    ;(async () => {
      const res = await fetch(`/api/org/volunteers?eventId=${encodeURIComponent(eventId)}`, { cache: "no-store" })
      if (!res.ok) return
      const json = await res.json()
      if (mounted) setRows((json?.data ?? []) as Array<import("zod").z.infer<typeof schema>>)
    })()
    return () => { mounted = false }
  }, [eventId])
  // Trigger skeleton fade-in on first paint
  React.useEffect(() => {
    if (!ready || eventId) return
    const id = requestAnimationFrame(() => setSkeletonVisible(true))
    return () => cancelAnimationFrame(id)
  }, [ready, eventId])
  if (!ready) {
    return (
      <main className={`p-6 space-y-4 transition-opacity duration-300 ${skeletonVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="rounded-lg border">
          <div className="border-b p-3">
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 p-3">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }
  // On phones, hide the data table and suggest using a computer
  if (isMobile) {
    return (
      <main className="p-6">
        <div className="rounded-lg border p-8 text-center">
          <h1 className="mb-2 text-base font-semibold">Volunteer management</h1>
          <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">
            Managing volunteers works best on a larger screen. Please visit this page from a laptop or desktop computer.
          </p>
          <Button asChild>
            <Link href="/org/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    )
  }
  if (eventOptions.length === 0) {
    return (
      <main className="p-6">
        <div className="rounded-lg border p-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">No events found for your organization.</p>
          <Button asChild>
            <Link href="/org/opportunities">Create an event to manage volunteers</Link>
          </Button>
        </div>
      </main>
    )
  }
  return (
    <main className="p-6">
      <DataTable
        data={rows}
        eventOptions={eventOptions}
        eventValue={eventId as string}
        onEventChange={(id) => setEventId(id)}
      />
    </main>
  )
}
