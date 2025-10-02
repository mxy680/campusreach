"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Page() {
  // Account info
  const [orgName, setOrgName] = React.useState("")
  const [orgEmail, setOrgEmail] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [orgId, setOrgId] = React.useState<string | null>(null)

  // Team access
  const [members, setMembers] = React.useState<Array<{ id: string; user: { id: string; name: string | null; email: string; image: string | null } }>>([])
  const [membersLoading, setMembersLoading] = React.useState(false)

  // Password
  const [currPassword, setCurrPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  React.useEffect(() => {
    setLoading(true)
    fetch("/api/org/settings")
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setOrgName(json?.name ?? "")
        setOrgEmail(json?.contactEmail ?? "")
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Load orgId (first org for this user)
  React.useEffect(() => {
    fetch("/api/orgs")
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const first = (json?.data ?? [])[0]?.id as string | undefined
        if (first) setOrgId(first)
      })
      .catch(() => {})
  }, [])

  // Load members when orgId is ready
  React.useEffect(() => {
    if (!orgId) return
    setMembersLoading(true)
    fetch(`/api/org/members?orgId=${encodeURIComponent(orgId)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setMembers(Array.isArray(json?.data) ? json.data : [])
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false))
  }, [orgId])

  return (
    <main className="p-4">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-3 grid w-full grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="team">Team access</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardContent className="pt-4">
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              ;(async () => {
                try {
                  setSaving(true)
                  const r = await fetch("/api/org/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: orgName.trim(), contactEmail: orgEmail.trim() }),
                  })
                  if (!r.ok) return
                } finally {
                  setSaving(false)
                }
              })()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your Organization" disabled={loading || saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Contact email</Label>
              <Input id="org-email" type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="contact@org.org" disabled={loading || saving} />
            </div>
            <div className="md:col-span-2 flex justify-end pt-2">
              <Button type="submit" disabled={loading || saving || !orgName.trim() || !orgEmail.trim()}>
                {saving ? "Saving..." : "Save account"}
              </Button>
            </div>
          </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardContent className="pt-4">
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newPassword || newPassword !== confirmPassword) return
              // TODO: wire to API
              setCurrPassword("")
              setNewPassword("")
              setConfirmPassword("")
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="curr-pass">Current password</Label>
              <Input id="curr-pass" type="password" value={currPassword} onChange={(e) => setCurrPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New password</Label>
              <Input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm password</Label>
              <Input id="confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="md:col-span-3 flex justify-end pt-2">
              <Button type="submit" disabled={!newPassword || newPassword !== confirmPassword}>Update password</Button>
            </div>
          </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">Team members</div>
                  <div className="text-sm text-muted-foreground">Allow coworkers to manage this organization.</div>
                </div>
                <Button
                  onClick={() => {
                    if (!orgId) return
                    // After Google login, callback page will link this Google account to the org and redirect back
                    const cb = `/auth/link-org?orgId=${encodeURIComponent(orgId)}`
                    signIn("google", { callbackUrl: cb })
                  }}
                  disabled={!orgId}
                >
                  Add account with Google
                </Button>
              </div>

              <div className="divide-y rounded border">
                {membersLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">Loading members…</div>
                ) : members.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No members yet.</div>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.user.image || undefined} alt={m.user.name || m.user.email} />
                        <AvatarFallback>{(m.user.name || m.user.email).slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{m.user.name || m.user.email}</div>
                        <div className="truncate text-xs text-muted-foreground">{m.user.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </main>
  )
}
