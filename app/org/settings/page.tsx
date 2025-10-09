"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function Page() {
  // Account info
  const [orgName, setOrgName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [orgEmail, setOrgEmail] = React.useState<string>("")
  const [userEmail, setUserEmail] = React.useState<string>("")
  const [members, setMembers] = React.useState<Array<{ id: string; user: { id: string; name: string | null; email: string; image: string | null } }>>([])
  const [baseUrl, setBaseUrl] = React.useState<string>("")

  // Browser-detected defaults
  const browserTz = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
    } catch {
      return "America/New_York"
    }
  }, [])
  const browserLocale = React.useMemo(() => {
    try {
      return typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US"
    } catch {
      return "en-US"
    }
  }, [])

  // Org preferences
  const [timezone, setTimezone] = React.useState<string>(browserTz)
  const [locale, setLocale] = React.useState<string>(browserLocale)
  const [defaultLocation, setDefaultLocation] = React.useState<string>("")
  const [defaultHours, setDefaultHours] = React.useState<number | undefined>(2)
  const [defaultVolunteers, setDefaultVolunteers] = React.useState<number | undefined>(10)

  // Simple option lists; can be expanded
  const timezones = React.useMemo(() => {
    const base = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Berlin",
    ]
    if (browserTz && !base.includes(browserTz)) base.unshift(browserTz)
    return base
  }, [browserTz])
  const locales = React.useMemo(() => {
    const base = ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES"]
    if (browserLocale && !base.includes(browserLocale)) base.unshift(browserLocale)
    return base
  }, [browserLocale])

  React.useEffect(() => {
    setLoading(true)
    fetch("/api/org/settings")
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setOrgName(json?.name ?? "")
        if (json?.id) setOrgId(json.id as string)
        setOrgEmail((json?.email as string) || "")
        setUserEmail((json?.userEmail as string) || "")
        setBaseUrl((json?.baseUrl as string) || "")
        setTimezone((prev) => (json?.timezone as string) || prev)
        setLocale((prev) => (json?.locale as string) || prev)
        setDefaultLocation((prev) => (json?.defaultEventLocationTemplate as string) || prev)
        setDefaultHours((prev) => (typeof json?.defaultTimeCommitmentHours === "number" ? json.defaultTimeCommitmentHours : prev))
        setDefaultVolunteers((prev) => (typeof json?.defaultVolunteersNeeded === "number" ? json.defaultVolunteersNeeded : prev))
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  // Load members when we have orgId
  React.useEffect(() => {
    if (!orgId) return
    ;(async () => {
      try {
        const r = await fetch(`/api/org/members?orgId=${encodeURIComponent(orgId)}`, { cache: "no-store" })
        if (!r.ok) return
        const j = await r.json()
        setMembers(Array.isArray(j?.data) ? j.data : [])
      } catch { }
    })()
  }, [orgId])

  // Invite URL helper
  const inviteUrl = React.useMemo(() => {
    if (!orgId) return ""
    const base = (baseUrl || "").replace(/\/$/, "")
    if (!base) return ""
    return `${base}/auth/link-org?orgId=${encodeURIComponent(orgId)}`
  }, [orgId, baseUrl])
  const [copied, setCopied] = React.useState(false)

  return (
    <main className="p-4 space-y-6">

      {/* Preferences */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Preferences</h2>
            <p className="text-sm text-muted-foreground">Defaults used across events, dates and formatting.</p>
          </div>
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
                ; (async () => {
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
              <Button type="submit" disabled={loading || saving}>
                {saving ? "Saving..." : "Save preferences"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      

      {/* Team members (only for primary org account: orgEmail === userEmail) */}
      {orgEmail && userEmail && orgEmail === userEmail && (
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base font-semibold">Team members</h2>
              <p className="text-sm text-muted-foreground">Allow coworkers to manage this organization.</p>
            </div>
            <div className="w-full md:w-auto md:min-w-[640px]">
              <Label className="mb-1 block text-xs text-muted-foreground">Invite link</Label>
              <div className="flex items-center gap-2">
                <Input value={inviteUrl} readOnly placeholder="Invite link appears here" className="flex-1" />
                <Button
                  type="button"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={!inviteUrl}
                  onClick={async () => {
                    if (!inviteUrl) return
                    try {
                      await navigator.clipboard.writeText(inviteUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    } catch {}
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Share this link with a coworker. They’ll sign in with Google and be added to your org.</p>
            </div>
          </div>
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-sm text-muted-foreground">No members yet.</div>
            ) : (
              <ul className="divide-y">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2">
                    {m.user.image ? (
                      <Image src={m.user.image} alt={m.user.name ?? m.user.email} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground/70">
                        {(m.user.name ?? m.user.email ?? "").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{m.user.name ?? m.user.email}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.user.email}</div>
                    </div>
                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        disabled={m.user.email === orgEmail}
                        title={m.user.email === orgEmail ? "Cannot remove the organization owner" : "Remove member"}
                        onClick={async () => {
                          if (!orgId) return
                          const confirmed = window.confirm(`Remove ${m.user.email}? This deletes their entire account.`)
                          if (!confirmed) return
                          try {
                            const res = await fetch("/api/org/members", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ orgId, userId: m.user.id }),
                            })
                            if (!res.ok) {
                              alert("Failed to remove member")
                              return
                            }
                            // Refresh list
                            const r = await fetch(`/api/org/members?orgId=${encodeURIComponent(orgId)}`, { cache: "no-store" })
                            if (r.ok) {
                              const j = await r.json()
                              setMembers(Array.isArray(j?.data) ? j.data : [])
                            }
                          } catch {
                            alert("Failed to remove member")
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Data export */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Export data</h2>
              <p className="text-sm text-muted-foreground">Export a full JSON snapshot of your data.</p>
            </div>
            <div className="shrink-0">
              <Button
                className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none"
                disabled
              >
                Export as JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-red-600">Danger zone</h2>
              <p className="text-sm text-muted-foreground">Be careful—this action is permanent.</p>
            </div>
            <div className="shrink-0">
              <Button
                variant="destructive"
                disabled
                className="disabled:opacity-50 disabled:pointer-events-none"
                title="Temporarily disabled"
              >
                Delete organization (disabled)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
