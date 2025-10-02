"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LinkOrgPage() {
  const router = useRouter()
  const params = useSearchParams()

  React.useEffect(() => {
    const orgId = params.get("orgId")
    if (!orgId) {
      router.replace("/org/settings")
      return
    }
    ;(async () => {
      try {
        await fetch("/api/org/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId }),
        })
      } finally {
        router.replace("/org/settings")
      }
    })()
  }, [params, router])

  return (
    <main className="p-6">
      <div className="text-sm text-muted-foreground">Linking your Google account to the organization…</div>
    </main>
  )
}
