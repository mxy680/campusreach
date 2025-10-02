"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { signIn, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Page() {
  // Account info
  const [orgName, setOrgName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [orgId, setOrgId] = React.useState<string | null>(null)

  // Team access
  const [members, setMembers] = React.useState<Array<{ id: string; user: { id: string; name: string | null; email: string; image: string | null } }>>([])
  const [membersLoading, setMembersLoading] = React.useState(false)

  // Org preferences
  const [timezone, setTimezone] = React.useState<string>("")
  const [locale, setLocale] = React.useState<string>("")
  const [defaultLocation, setDefaultLocation] = React.useState<string>("")
  const [defaultHours, setDefaultHours] = React.useState<number | undefined>(undefined)
  const [defaultVolunteers, setDefaultVolunteers] = React.useState<number | undefined>(undefined)

  // Simple option lists; can be expanded
  const timezones = React.useMemo(() => [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Berlin",
  ], [])
  const locales = React.useMemo(() => [
    "en-US",
    "en-GB",
    "de-DE",
    "fr-FR",
    "es-ES",
  ], [])

  React.useEffect(() => {
    setLoading(true)
    fetch("/api/org/settings")
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setOrgName(json?.name ?? "")
        if (json?.id) setOrgId(json.id as string)
        setTimezone((json?.timezone as string) || "")
        setLocale((json?.locale as string) || "")
        setDefaultLocation((json?.defaultEventLocationTemplate as string) || "")
        setDefaultHours(typeof json?.defaultTimeCommitmentHours === "number" ? json.defaultTimeCommitmentHours : undefined)
        setDefaultVolunteers(typeof json?.defaultVolunteersNeeded === "number" ? json.defaultVolunteersNeeded : undefined)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Ensure current user is a member, then load members
  React.useEffect(() => {
    if (!orgId) return
    setMembersLoading(true)
    ;(async () => {
      try {
        await fetch(`/api/org/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId }),
        })
      } catch {}
      try {
        const r = await fetch(`/api/org/members?orgId=${encodeURIComponent(orgId)}`)
        if (r.ok) {
          const json = await r.json()
          setMembers(Array.isArray(json?.data) ? json.data : [])
        }
      } catch {}
      setMembersLoading(false)
    })()
  }, [orgId])

  return (
    <main className="p-4 space-y-4">
      <Card>
        <CardContent className="pt-4 space-y-4">
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
                    body: JSON.stringify({
                      name: orgName.trim(),
                      timezone: timezone.trim() || undefined,
                      locale: locale.trim() || undefined,
                      defaultEventLocationTemplate: defaultLocation.trim() || undefined,
                      defaultTimeCommitmentHours: typeof defaultHours === "number" ? defaultHours : undefined,
                      defaultVolunteersNeeded: typeof defaultVolunteers === "number" ? defaultVolunteers : undefined,
                    }),
                  })
                  if (!r.ok) return
                } finally {
                  setSaving(false)
                }
              })()
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your Organization" disabled={loading || saving} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={(v) => setTimezone(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Locale</Label>
              <Select value={locale} onValueChange={(v) => setLocale(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="org-default-location">Default event location template</Label>
              <Input id="org-default-location" value={defaultLocation} onChange={(e) => setDefaultLocation(e.target.value)} placeholder="e.g., Room 101, Main Hall" disabled={loading || saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-default-hours">Default time commitment (hours)</Label>
              <Input id="org-default-hours" type="number" value={defaultHours ?? ""} onChange={(e) => setDefaultHours(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="e.g., 2" disabled={loading || saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-default-vols">Default number of volunteers</Label>
              <Input id="org-default-vols" type="number" value={defaultVolunteers ?? ""} onChange={(e) => setDefaultVolunteers(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="e.g., 10" disabled={loading || saving} />
            </div>
            <div className="md:col-span-2 flex justify-end pt-2">
              <Button type="submit" disabled={loading || saving || !orgName.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>

          {/* Export data */}
          <div className="space-y-2 pt-2">
            <div className="font-medium">Export data</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/api/org/export?type=signups">Export signups CSV</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/org/export?type=volunteers">Export volunteers CSV</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/org/export?type=messages">Export messages CSV</a>
              </Button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium">Team members</div>
              <div className="text-sm text-muted-foreground">Allow coworkers to manage this organization.</div>
            </div>
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
                  <div className="ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!orgId) return
                        if (!confirm(`Remove ${m.user.email}?`)) return
                        await fetch(`/api/org/members`, {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orgId, userId: m.user.id }),
                        })
                        // refresh
                        const r = await fetch(`/api/org/members?orgId=${encodeURIComponent(orgId)}`)
                        if (r.ok) {
                          const json = await r.json()
                          setMembers(Array.isArray(json?.data) ? json.data : [])
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Danger zone */}
          <div className="space-y-2 pt-4">
            <div className="font-medium text-red-600">Danger zone</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/api/org/export?type=account">Export account JSON</a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!orgId) return
                  const cb = `/auth/link-org?orgId=${encodeURIComponent(orgId)}`
                  signIn("google", { callbackUrl: cb })
                }}
                disabled={!orgId}
              >
                Add team member (Google)
              </Button>
            </div>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!orgId) return
                if (!confirm("Delete organization? This cannot be undone.")) return
                const r = await fetch("/api/org/delete", { method: "DELETE" })
                if (r.ok) {
                  await signOut({ callbackUrl: "/" })
                }
              }}
            >
              Delete organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
