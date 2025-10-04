"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconMessage2 } from "@tabler/icons-react"

export default function MessagesPreviewSection({ className = "" }: { className?: string }) {
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? ""
  const [rows, setRows] = React.useState<Array<{ id: string; from: string; subject: string; date: string }>>([])

  React.useEffect(() => {
    if (!userEmail) return
    fetch(`/api/user/messages?email=${encodeURIComponent(userEmail)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setRows((json?.data ?? []) as typeof rows)
      })
      .catch(() => {})
  }, [userEmail])

  return (
    <CardContent className={`space-y-1.5 ${className}`}>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <IconMessage2 className="size-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">No messages yet.</div>
          <Button size="sm" asChild>
            <a href="/user/messaging">Send a message</a>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Messages</div>
            <Button size="sm" variant="ghost" asChild>
              <a href="/user/messaging">See all</a>
            </Button>
          </div>
          <ul className="divide-y rounded-md border">
            {rows.map((m) => (
              <li key={m.id} className="p-2">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{m.from}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">{m.subject}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </CardContent>
  )
}
