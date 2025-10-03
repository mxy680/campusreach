"use client"

import * as React from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { ChatRow } from "./page"

export default function ChatListClient({ initialRows }: { initialRows: ChatRow[] }) {
  const [query, setQuery] = React.useState("")
  const [rows] = React.useState<ChatRow[]>(initialRows)

  const chats = React.useMemo(() => {
    if (!query) return rows
    const q = query.toLowerCase()
    return rows.filter((r) => r.title.toLowerCase().includes(q) || r.orgName.toLowerCase().includes(q) || (r.last?.body ?? "").toLowerCase().includes(q))
  }, [query, rows])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{chats.length}</span>
          <span className="text-sm text-muted-foreground">group chats</span>
        </div>
        <div className="w-full max-w-sm">
          <Input placeholder="Search group chats..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {chats.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2">
          {chats.map((c) => (
            <li key={c.id}>
              <Link
                href={`/org/messaging/${c.id}`}
                className="group flex items-start gap-3 rounded-lg border bg-card p-3 md:p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="bg-muted text-foreground/80 flex size-9 select-none items-center justify-center rounded-full text-xs font-medium">
                  {c.orgName?.[0]?.toUpperCase() || "E"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold leading-tight">{c.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.orgName}</div>
                    </div>
                    <div className="ml-auto shrink-0 text-right">
                      <div className="text-[11px] text-muted-foreground">
                        {c.last ? new Date(c.last.createdAt).toLocaleString() : new Date(c.start).toLocaleDateString()}
                      </div>
                      <div className="mt-1">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{c.messageCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-foreground/80 line-clamp-2">
                    {c.last ? (
                      <>
                        {c.last.kind === "ANNOUNCEMENT" && (
                          <Badge variant="secondary" className="mr-1 px-1.5 py-0.5 text-[10px]">Announcement</Badge>
                        )}
                        <span className="text-muted-foreground">{c.last.author ? c.last.author + ": " : ""}</span>
                        {c.last.body}
                      </>
                    ) : (
                      <span className="text-muted-foreground">No messages yet</span>
                    )}
                  </div>
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
