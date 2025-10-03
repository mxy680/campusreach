"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { IconSend } from "@tabler/icons-react"

function useEventChat(eventId: string | undefined) {
  const [messages, setMessages] = React.useState<Array<{ id: string; createdAt: string; kind: "MESSAGE" | "ANNOUNCEMENT"; body: string; user?: { name?: string | null; image?: string | null }; organization?: { name: string | null } }>>([])
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchMore = React.useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (cursor) qs.set("cursor", cursor)
      qs.set("limit", "500")
      const res = await fetch(`/api/org/events/${encodeURIComponent(eventId)}/chat?${qs.toString()}`, { cache: "no-store" })
      if (!res.ok) return
      const json = await res.json()
      setMessages((prev) => {
        const incoming = (json?.data ?? []) as typeof prev
        // If no cursor (initial fetch), replace; otherwise append and de-duplicate by id
        const combined = cursor ? [...prev, ...incoming] : incoming
        const seen = new Set<string>()
        const dedup: typeof prev = []
        for (const m of combined) {
          if (!seen.has(m.id)) {
            seen.add(m.id)
            dedup.push(m)
          }
        }
        return dedup
      })
      setCursor(json?.nextCursor ?? null)
    } finally {
      setLoading(false)
    }
  }, [eventId, cursor])

  React.useEffect(() => {
    setMessages([])
    setCursor(null)
  }, [eventId])

  React.useEffect(() => {
    fetchMore()
  }, [fetchMore])

  const resetAndRefetch = React.useCallback(() => {
    setMessages([])
    setCursor(null)
    fetchMore()
  }, [fetchMore])

  return { messages, loading, fetchMore, resetAndRefetch }
}

export default function OrgEventChatPage() {
  const params = useParams<{ id: string }>()
  const eventId = params?.id
  const { messages, loading, fetchMore, resetAndRefetch } = useEventChat(eventId)
  const [text, setText] = React.useState("")
  // Simple composer (no announcement toggle on this view)

  async function send() {
    if (!eventId || !text.trim()) return
    const body = text.trim()
    setText("")
    try {
      const res = await fetch(`/api/org/events/${encodeURIComponent(eventId)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, kind: "MESSAGE" }),
      })
      if (!res.ok) throw new Error("send")
      // Refetch to replace entirely and avoid duplicate keys
      resetAndRefetch()
    } catch {
      // If failed, reset and refetch to replace
      resetAndRefetch()
    }
  }

  return (
    <main className="flex h-[calc(100dvh-60px)] flex-col p-4 md:p-6">
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
            {/* Load more removed; fetching a larger page size instead */}
          </div>
          <div className="border-t p-3 md:p-4 flex items-center gap-2">
            <Input
              placeholder="Write a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <Button onClick={send} disabled={!text.trim()} size="sm">
              <IconSend className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
