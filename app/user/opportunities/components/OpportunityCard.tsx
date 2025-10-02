"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { IconCalendar, IconMapPin, IconUsers, IconClock } from "@tabler/icons-react"
import type { Opportunity } from "./types"

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })

export function OpportunityCard({ o }: { o: Opportunity }) {
  const [joining, setJoining] = React.useState(false)
  const [joined, setJoined] = React.useState(!!o.alreadyJoined)
  const [joinedCount, setJoinedCount] = React.useState(o.joined)

  async function signUp() {
    try {
      setJoining(true)
      const res = await fetch("/api/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: o.id }),
      })
      if (!res.ok) throw new Error("Failed to sign up")
      setJoined(true)
      setJoinedCount((c) => c + 1)
      toast("You're signed up for this opportunity")
    } catch {
      toast.error("Could not sign up. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardContent className="p-3 flex h-full flex-col">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-medium">{o.title}</div>
            <div className="truncate text-xs text-muted-foreground">{o.org}</div>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{o.teaser}</p>

        <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><IconCalendar className="size-4" /><span>{fmt(o.start)}{o.end ? ` — ${fmt(o.end)}` : ""}</span></div>
          <div className="flex items-center gap-2"><IconMapPin className="size-4" /><span>{o.location}</span></div>
          <div className="flex items-center gap-2"><IconUsers className="size-4" /><span>{joinedCount}/{o.need} volunteers</span></div>
          <div className="flex items-center gap-2"><IconClock className="size-4" /><span>{o.hours != null ? `${o.hours} hrs` : (o.end ? `${Math.round((new Date(o.end).getTime() - new Date(o.start).getTime())/3600000)} hrs` : "Flexible")}</span></div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {o.skills.map((s) => (
            <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>
          ))}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground line-clamp-2 min-h-[1.25rem]">
            {o.notes ?? ""}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={signUp} disabled={joining || joined}>
              {joined ? "Joined" : (joining ? "Signing…" : "Sign up")}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/user/messaging">Contact</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
