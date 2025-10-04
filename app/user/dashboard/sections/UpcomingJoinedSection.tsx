"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCalendar } from "@tabler/icons-react"

type Opportunity = {
  id: string
  title: string
  org: string
  when: string // ISO
  location: string
  need: number
  joined: number
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function UpcomingJoinedSection() {
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? ""
  const [upcoming, setUpcoming] = React.useState<Opportunity[]>([])

  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/upcoming?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const rows = (json?.data ?? []) as Opportunity[]
        setUpcoming(rows)
      })
      .catch(() => {})
  }, [userEmail])

  return (
    <CardContent className="space-y-1.5">
      {upcoming.length === 0 ? (
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
            {upcoming.slice(0, 3).map((ev) => (
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
  )
}
