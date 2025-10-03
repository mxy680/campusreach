"use client"

import * as React from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type ChatRow = {
  id: string
  title: string
  start: string
  end: string | null
  orgName: string
  orgSlug: string | null
  orgLogo: string | null
  messageCount: number
  last: { id: string; createdAt: string; kind: "MESSAGE" | "ANNOUNCEMENT"; body: string; author: string } | null
}

export default function Page() {
  const [query, setQuery] = React.useState("")
  const [rows, setRows] = React.useState<ChatRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    setLoading(true)
    fetch("/api/org/chats", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        if (active) setRows((json?.data ?? []) as ChatRow[])
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const chats = React.useMemo(() => {
    if (!query) return rows
    const q = query.toLowerCase()
    return rows.filter((r) => r.title.toLowerCase().includes(q) || r.orgName.toLowerCase().includes(q) || r.last?.body.toLowerCase().includes(q))
  }, [query, rows])

  return (
    <div className="flex min-h-[600px] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-base font-semibold">Chat</div>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{chats.length}</span>
        </div>
        <div className="w-full max-w-sm">
          <Input placeholder="Search group chats..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <ul className="divide-y rounded-md border"><li className="p-4 text-sm text-muted-foreground">Loading chats…</li></ul>
      ) : chats.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {chats.map((c) => (
            <li key={c.id} className="group p-3 md:p-4 hover:bg-muted/40 transition">
              <Link href={`/org/events/${c.id}/chat`} className="flex items-start gap-3">
                <div className="bg-muted text-foreground/80 flex size-8 select-none items-center justify-center rounded-full text-xs font-medium">
                  {c.orgName?.[0]?.toUpperCase() || "E"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{c.title}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {c.last ? new Date(c.last.createdAt).toLocaleString() : new Date(c.start).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{c.orgName}</div>
                  {c.last ? (
                    <div className="text-xs text-foreground/80 line-clamp-2">
                      {c.last.kind === "ANNOUNCEMENT" && <Badge variant="secondary" className="mr-1 px-1.5 py-0.5 text-[10px]">Announcement</Badge>}
                      <span className="text-muted-foreground">{c.last.author ? c.last.author + ": " : ""}</span>
                      {c.last.body}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No messages yet</div>
                  )}
                </div>
                <div className="shrink-0">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c.messageCount}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">No chats yet.</div>
      )}
    </div>
  )
}
