"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { IconCalendar, IconMapPin, IconUsers, IconClock, IconExternalLink } from "@tabler/icons-react"
import type { Opportunity } from "./types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })

export function OpportunityCard({ o }: { o: Opportunity }) {
  const [joining, setJoining] = React.useState(false)
  const [joined, setJoined] = React.useState(!!o.alreadyJoined)
  const [joinedCount, setJoinedCount] = React.useState(o.joined)

  async function onToggleJoin() {
    try {
      setJoining(true)
      if (joined) {
        // Leave
        const res = await fetch("/api/user/signup", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: o.id }),
        })
        if (!res.ok) throw new Error("Failed to leave")
        setJoined(false)
        setJoinedCount((c) => Math.max(0, c - 1))
        toast("You left this opportunity")
      } else {
        // Join
        const res = await fetch("/api/user/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: o.id }),
        })
        if (!res.ok) throw new Error("Failed to sign up")
        setJoined(true)
        setJoinedCount((c) => c + 1)
        toast("You're signed up for this opportunity")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <Card className="relative overflow-hidden flex flex-col border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-full w-0.5 bg-primary/60" />
      <CardContent className="py-1 md:px-5 flex h-full flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg md:text-xl font-semibold leading-tight">{o.title}</div>
            {o.orgSlug ? (
              <a
                href={`/o/${o.orgSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 truncate text-sm md:text-[0.95rem] font-medium text-foreground/80 hover:text-foreground"
                title="Open organization profile"
              >
                <span className="truncate">{o.org}</span>
                <IconExternalLink className="size-3.5 opacity-80" aria-hidden />
              </a>
            ) : (
              <div className="truncate text-sm font-medium text-foreground/70">{o.org}</div>
            )}
          </div>
        </div>

        <p className="text-[15px] md:text-base text-muted-foreground">{o.teaser}</p>

        <div className="mt-1 grid grid-cols-1 gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><IconCalendar className="size-4" /><span>{fmt(o.start)}{o.end ? ` — ${fmt(o.end)}` : ""}</span></div>
          <div className="flex items-center gap-2"><IconMapPin className="size-4" /><span>{o.location}</span></div>
          <div className="flex items-center gap-2"><IconUsers className="size-4" /><span>{joinedCount}/{o.need} volunteers</span></div>
          <div className="flex items-center gap-2"><IconClock className="size-4" /><span>{o.hours != null ? `${o.hours} hrs` : (o.end ? `${Math.round((new Date(o.end).getTime() - new Date(o.start).getTime())/3600000)} hrs` : "Flexible")}</span></div>
        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          {o.skills.map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px] font-medium px-2 py-0.5">{s}</Badge>
          ))}
        </div>

        <Separator className="my-1" />

        <div className="mt-auto pt-1 flex items-center justify-between">
          <div className="text-sm text-muted-foreground min-h-[1rem]">
            {o.notes ?? ""}
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={onToggleJoin} disabled={joining} variant={joined ? "destructive" : "default"}>
              {joined ? (joining ? "Leaving…" : "Leave") : (joining ? "Signing…" : "Sign up")}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Details</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4">
                  <DialogHeader>
                    <DialogTitle className="text-xl leading-tight">{o.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {o.orgSlug ? (
                        <a href={`/o/${o.orgSlug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-foreground/80 hover:text-foreground">
                          <span>{o.org}</span>
                          <IconExternalLink className="size-3.5 opacity-80" aria-hidden />
                        </a>
                      ) : (
                        <span className="font-medium text-foreground/70">{o.org}</span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="px-5 py-4 space-y-4 text-sm">
                  {o.teaser && (
                    <p className="text-muted-foreground whitespace-pre-line">{o.teaser}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                    <div className="flex items-center gap-2"><IconCalendar className="size-4" /><span>{fmt(o.start)}{o.end ? ` — ${fmt(o.end)}` : ""}</span></div>
                    <div className="flex items-center gap-2"><IconMapPin className="size-4" /><span>{o.location}</span></div>
                    <div className="flex items-center gap-2"><IconUsers className="size-4" /><span>{joinedCount}/{o.need} volunteers</span></div>
                    <div className="flex items-center gap-2"><IconClock className="size-4" /><span>{o.hours != null ? `${o.hours} hrs` : (o.end ? `${Math.round((new Date(o.end).getTime() - new Date(o.start).getTime())/3600000)} hrs` : "Flexible")}</span></div>
                  </div>

                  {o.attendees && o.attendees.length > 0 && (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <div className="mb-2 text-xs font-medium text-foreground">Volunteers joined</div>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {o.attendees.slice(0, 8).map((n, i) => (
                          <span key={i} className="rounded bg-background border px-1.5 py-0.5">{n}</span>
                        ))}
                        {joinedCount > (o.attendees?.length ?? 0) && (
                          <span className="rounded bg-background border px-1.5 py-0.5">+{joinedCount - (o.attendees?.length ?? 0)} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {o.skills?.length ? (
                    <div>
                      <div className="mb-1 text-xs font-medium text-foreground">Skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {o.skills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px] font-medium px-2 py-0.5">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {o.notes && (
                    <div>
                      <div className="mb-1 text-xs font-medium text-foreground">Notes</div>
                      <p className="text-muted-foreground">{o.notes}</p>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end gap-2">
                    <Button size="sm" onClick={onToggleJoin} disabled={joining} variant={joined ? "destructive" : "default"}>
                      {joined ? (joining ? "Leaving…" : "Leave") : (joining ? "Signing…" : "Sign up")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
