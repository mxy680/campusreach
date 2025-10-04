import * as React from "react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ChatListClient from "./ChatListClient"
import { headers } from "next/headers"

export type ChatRow = {
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

async function fetchChats(): Promise<ChatRow[]> {
  let baseUrl: string | undefined
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? undefined
    const proto = h.get("x-forwarded-proto") ?? (host && host.includes("localhost") ? "http" : "https")
    if (host) baseUrl = `${proto}://${host}`
    const cookie = h.get("cookie") ?? ""
    if (baseUrl) {
      const resAbs = await fetch(`${baseUrl}/api/user/chats`, { cache: "no-store", headers: { cookie } })
      if (resAbs.ok) {
        const json = await resAbs.json()
        return (json?.data ?? []) as ChatRow[]
      }
    }
  } catch {}
  if (!baseUrl) baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/user/chats`, { cache: "no-store", headers: { cookie: '' } })
  if (!res.ok) return []
  const json = await res.json()
  return (json?.data ?? []) as ChatRow[]
}

function ChatsSkeleton() {
  return (
    <ul className="divide-y rounded-md border">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 p-3 md:p-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-4 w-10" />
        </li>
      ))}
    </ul>
  )
}

async function ChatsSection() {
  const rows = await fetchChats()
  return <ChatListClient initialRows={rows} />
}

export default function Page() {
  return (
    <div className="flex min-h-[600px] flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-base font-semibold">Chat</div>
      </div>
      <Suspense fallback={<ChatsSkeleton />}>
        <ChatsSection />
      </Suspense>
    </div>
  )
}
