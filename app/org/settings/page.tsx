"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { signIn, signOut } from "next-auth/react"

export default function Page() {
  // Account info
  const [orgName, setOrgName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [orgId, setOrgId] = React.useState<string | null>(null)

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
        setTimezone((prev) => (json?.timezone as string) || prev)
        setLocale((prev) => (json?.locale as string) || prev)
        setDefaultLocation((prev) => (json?.defaultEventLocationTemplate as string) || prev)
        setDefaultHours((prev) => (typeof json?.defaultTimeCommitmentHours === "number" ? json.defaultTimeCommitmentHours : prev))
        setDefaultVolunteers((prev) => (typeof json?.defaultVolunteersNeeded === "number" ? json.defaultVolunteersNeeded : prev))
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  // Member list removed; no loading of members needed

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

      {/* Team members */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Team members</h2>
              <p className="text-sm text-muted-foreground">Allow coworkers to manage this organization.</p>
            </div>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => {
                if (!orgId) return
                const cb = `/auth/link-org?orgId=${encodeURIComponent(orgId)}`
                signIn("google", { callbackUrl: cb })
              }}
            >
              <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                {/* Google G logo (monochrome) */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path d="M21.35 11.1h-8.9v2.98h5.1c-.22 1.3-.93 2.4-1.98 3.14l3.2 2.48c1.87-1.73 2.95-4.28 2.95-7.38 0-.64-.06-1.25-.17-1.83z" />
                  <path d="M12.45 22c2.67 0 4.91-.88 6.55-2.39l-3.2-2.48c-.89.6-2.02.95-3.35.95-2.57 0-4.75-1.73-5.53-4.06H3.59v2.55A9.55 9.55 0 0 0 12.45 22z" />
                  <path d="M6.92 13.99a5.73 5.73 0 0 1 0-3.98V7.46H3.59a9.57 9.57 0 0 0 0 9.08l3.33-2.55z" />
                  <path d="M12.45 5.52c1.45 0 2.74.5 3.76 1.47l2.82-2.82A9.52 9.52 0 0 0 12.45 2 9.55 9.55 0 0 0 3.59 7.46l3.33 2.55c.78-2.33 2.96-4.49 5.53-4.49z" />
                </svg>
              </span>
              Add team member
            </Button>
          </div>
          {/* Member list removed per request */}
        </CardContent>
      </Card>

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
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
