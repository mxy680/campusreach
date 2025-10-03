"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { IconSpeakerphone, IconSend } from "@tabler/icons-react"

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
      qs.set("limit", "50")
      const res = await fetch(`/api/org/events/${encodeURIComponent(eventId)}/chat?${qs.toString()}`, { cache: "no-store" })
      if (!res.ok) return
      const json = await res.json()
      setMessages((prev) => [...prev, ...(json?.data ?? [])])
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

  return { messages, loading, fetchMore }
}

export default function OrgEventChatPage() {
  const params = useParams<{ id: string }>()
  const eventId = params?.id
  const { messages, loading, fetchMore } = useEventChat(eventId)
  const [text, setText] = React.useState("")
  const [announcement, setAnnouncement] = React.useState(false)

  async function send() {
    if (!eventId || !text.trim()) return
    const body = text.trim()
    setText("")
    const optimistic = {
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      kind: announcement ? "ANNOUNCEMENT" as const : "MESSAGE" as const,
      body,
    }
    // Optimistic
    ;(window as any)._setChatMessages?.((prev: any[]) => [...prev, optimistic])
    try {
      const res = await fetch(`/api/org/events/${encodeURIComponent(eventId)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, kind: announcement ? "ANNOUNCEMENT" : "MESSAGE" }),
      })
      if (!res.ok) throw new Error("send")
    } catch {
      // If failed, just refetch to reconcile
      fetchMore()
    }
  }

  // Expose setter for optimistic update
  React.useEffect(() => {
    ;(window as any)._setChatMessages = (updater: (prev: any[]) => any[]) => {
      try {
        // basic in-place optimistic update helper
        const next = updater(messages)
        ;(window as any)._chatMessagesSnapshot = next
      } catch {}
    }
    return () => { delete (window as any)._setChatMessages }
  }, [messages])

  return (
    <main className="flex h-[calc(100dvh-60px)] flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Chat</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={announcement ? "destructive" : "outline"}
            size="sm"
            onClick={() => setAnnouncement((v) => !v)}
            className="gap-1"
            title="Toggle announcement"
          >
            <IconSpeakerphone className="size-4" />
            {announcement ? "Announcement" : "Message"}
          </Button>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="min-h-0 flex-1 overflow-auto p-3 space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                  {m.kind === "ANNOUNCEMENT" && <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">Announcement</Badge>}
                </div>
                <div className={`rounded-md border p-2 ${m.kind === "ANNOUNCEMENT" ? "bg-amber-50 border-amber-200" : "bg-background"}`}>
                  <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                </div>
              </div>
            ))}
            {!loading && (
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" onClick={fetchMore}>Load more</Button>
              </div>
            )}
          </div>
          <div className="border-t p-2 flex items-center gap-2">
            <Input
              placeholder={announcement ? "Write an announcement..." : "Write a message..."}
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
