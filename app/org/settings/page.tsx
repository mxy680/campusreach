"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
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
  const [orgContactEmail, setOrgContactEmail] = React.useState<string>("")
  const [userEmail, setUserEmail] = React.useState<string>("")
  const [members, setMembers] = React.useState<Array<{ id: string; user: { id: string; name: string | null; email: string; image: string | null } }>>([])
  const [pending, setPending] = React.useState<Array<{ id: string; message: string | null; createdAt: string; user: { id: string; name: string | null; email: string; image: string | null } }>>([])
  // invite links removed; no baseUrl needed

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
  const [deleting, setDeleting] = React.useState(false)

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
        setOrgContactEmail((json?.contactEmail as string) || "")
        setUserEmail((json?.userEmail as string) || "")
        // baseUrl no longer used
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

  // Load pending join requests (owner-only UI will show this block)
  React.useEffect(() => {
    if (!orgId) return
    ;(async () => {
      try {
        const r = await fetch(`/api/org/join-requests?organizationId=${encodeURIComponent(orgId)}`, { cache: "no-store" })
        if (!r.ok) return
        const j = await r.json()
        setPending(Array.isArray(j?.data) ? j.data : [])
      } catch { }
    })()
  }, [orgId])

  // Invite link deprecated

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
          <div className="mb-4">
            <h2 className="text-base font-semibold">Team members</h2>
            <p className="text-sm text-muted-foreground">Manage who has access to this organization.</p>
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

          {/* Pending join requests */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-2">Pending join requests</h3>
            {pending.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending requests.</div>
            ) : (
              <ul className="divide-y">
                {pending.map((req) => (
                  <li key={req.id} className="flex items-center gap-3 py-2">
                    {req.user.image ? (
                      <Image src={req.user.image} alt={req.user.name ?? req.user.email} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground/70">
                        {(req.user.name ?? req.user.email ?? '').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{req.user.name ?? req.user.email}</div>
                      <div className="text-xs text-muted-foreground truncate">{req.user.email}</div>
                      {req.message && <div className="text-xs text-muted-foreground mt-1">“{req.message}”</div>}
                    </div>
                    <div className="shrink-0 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={async () => {
                          try {
                            const r = await fetch(`/api/org/join-requests/${req.id}/decision`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ decision: 'APPROVE' }),
                            })
                            if (!r.ok) return alert('Failed to approve')
                            // refresh pending and members
                            if (orgId) {
                              const [rp, rm] = await Promise.all([
                                fetch(`/api/org/join-requests?organizationId=${encodeURIComponent(orgId)}`, { cache: 'no-store' }),
                                fetch(`/api/org/members?orgId=${encodeURIComponent(orgId)}`, { cache: 'no-store' }),
                              ])
                              if (rp.ok) { const j = await rp.json(); setPending(Array.isArray(j?.data) ? j.data : []) }
                              if (rm.ok) { const j2 = await rm.json(); setMembers(Array.isArray(j2?.data) ? j2.data : []) }
                            }
                          } catch { alert('Failed to approve') }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            const r = await fetch(`/api/org/join-requests/${req.id}/decision`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ decision: 'DECLINE' }),
                            })
                            if (!r.ok) return alert('Failed to decline')
                            // refresh pending
                            if (orgId) {
                              const rp = await fetch(`/api/org/join-requests?organizationId=${encodeURIComponent(orgId)}`, { cache: 'no-store' })
                              if (rp.ok) { const j = await rp.json(); setPending(Array.isArray(j?.data) ? j.data : []) }
                            }
                          } catch { alert('Failed to decline') }
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  </li>) )}
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
              {(() => {
                const isOwner = Boolean(userEmail) && (userEmail === orgEmail || (!!orgContactEmail && userEmail === orgContactEmail))
                const disabled = loading || saving || !isOwner
                return (
                <Button
                  className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none"
                  disabled={disabled}
                  onClick={async () => {
                    try {
                      const r = await fetch("/api/org/export?type=account")
                      if (!r.ok) return
                      const blob = await r.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `organization-${orgId || "account"}.json`
                      document.body.appendChild(a)
                      a.click()
                      a.remove()
                      URL.revokeObjectURL(url)
                    } catch {}
                  }}
                >
                  Export as JSON
                </Button>
                )
              })()}
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
              {(() => {
                const isOwner = Boolean(userEmail) && (userEmail === orgEmail || (!!orgContactEmail && userEmail === orgContactEmail))
                const disabled = loading || saving || deleting
                if (isOwner) {
                  return (
                    <Button
                      variant="destructive"
                      disabled={disabled}
                      className="disabled:opacity-50 disabled:pointer-events-none"
                      title="Delete this organization"
                      onClick={async () => {
                        const confirmed = window.confirm("This will permanently delete the organization and all related data. Continue?")
                        if (!confirmed) return
                        try {
                          setDeleting(true)
                          const r = await fetch("/api/org/delete", { method: "DELETE" })
                          if (!r.ok) {
                            alert("Failed to delete organization")
                            return
                          }
                          await signOut({ callbackUrl: "/" })
                        } catch {
                          alert("Failed to delete organization")
                        } finally {
                          setDeleting(false)
                        }
                      }}
                    >
                      {deleting ? "Deleting…" : "Delete organization"}
                    </Button>
                  )
                }
                // Non-owner: allow deleting their own account
                return (
                  <Button
                    variant="destructive"
                    disabled={disabled}
                    className="disabled:opacity-50 disabled:pointer-events-none"
                    title="Delete my account"
                    onClick={async () => {
                      const confirmed = window.confirm("This will permanently delete your account and remove your access to this org. Continue?")
                      if (!confirmed) return
                      try {
                        setDeleting(true)
                        const r = await fetch("/api/user/deactivate", { method: "DELETE" })
                        if (!r.ok) {
                          alert("Failed to delete account")
                          return
                        }
                        await signOut({ callbackUrl: "/" })
                      } catch {
                        alert("Failed to delete account")
                      } finally {
                        setDeleting(false)
                      }
                    }}
                  >
                    {deleting ? "Deleting…" : "Delete my account"}
                  </Button>
                )
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
