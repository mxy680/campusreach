"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export default function ConfirmClient({ orgId, currentUrl, user }: { orgId: string; currentUrl: string; user: { name?: string | null; email?: string | null } }) {
  async function linkNow() {
    try {
      await fetch("/api/org/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      })
    } finally {
      window.location.replace("/org/settings?linked=1")
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <h1 className="text-base font-semibold">Join organization</h1>
          <p className="text-sm text-muted-foreground">You are currently signed in as <strong>{user.email || user.name || "your account"}</strong>.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={linkNow} className="sm:flex-1">Continue as {user.email || "current account"}</Button>
          <Button
            type="button"
            variant="outline"
            className="sm:flex-1"
            onClick={() => signOut({ callbackUrl: currentUrl })}
            title="Use a different Google account"
          >
            Use a different account
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">To invite a coworker who is not in the system yet, choose “Use a different account” and sign in with their Google account.</p>
      </div>
    </main>
  )
}
