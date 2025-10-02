"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function Page() {
  const { data: session } = useSession()
  const emailFromSession = session?.user?.email ?? ""
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [notifEmail, setNotifEmail] = React.useState(true)
  const [notifPush, setNotifPush] = React.useState(false)
  const [notifDigest, setNotifDigest] = React.useState(true)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    if (!emailFromSession) return
    setLoading(true)
    fetch(`/api/user/settings?email=${encodeURIComponent(emailFromSession)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        setName(json?.user?.name ?? "")
        setEmail(json?.user?.email ?? "")
        setNotifEmail(!!json?.notifications?.emailUpdates)
        setNotifPush(!!json?.notifications?.pushEnabled)
        setNotifDigest(!!json?.notifications?.weeklyDigest)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [emailFromSession])

  const onSave = async () => {
    if (!emailFromSession) return
    setSaving(true)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailFromSession,
          name,
          newEmail: email,
          notifications: { emailUpdates: notifEmail, pushEnabled: notifPush, weeklyDigest: notifDigest },
        }),
      })
      if (!res.ok) {
        toast("Failed to save settings", { description: "Please try again." })
        return
      }
      toast("Settings saved", { description: "Your changes have been saved." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Settings</CardTitle>
          <CardDescription>Update your account and notification preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled readOnly placeholder="name@school.edu" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} />
              Email me about new opportunities and reminders
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={notifPush} onChange={(e) => setNotifPush(e.target.checked)} />
              Enable push notifications
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={notifDigest} onChange={(e) => setNotifDigest(e.target.checked)} />
              Send a weekly email digest
            </label>
            <div className="md:col-span-2 flex items-center justify-end">
              <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>These actions are irreversible.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Export a copy of your data (JSON).</div>
            <Button
              variant="outline"
              onClick={async () => {
                if (!emailFromSession) return
                const r = await fetch(`/api/user/settings/export?email=${encodeURIComponent(emailFromSession)}`)
                if (!r.ok) {
                  toast("Export failed", { description: "Please try again." })
                  return
                }
                const data = await r.json()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `campusreach-export-${new Date().toISOString().slice(0,10)}.json`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
                toast("Export ready", { description: "Your data has been downloaded." })
              }}
            >
              Export my data
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Reset account settings and profile to defaults (non-destructive).</div>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!emailFromSession) return
                const r = await fetch(`/api/user/settings/reset`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: emailFromSession }),
                })
                if (!r.ok) {
                  toast("Reset failed", { description: "Please try again." })
                  return
                }
                toast("Account reset", { description: "Your settings were reset to defaults." })
                // re-load
                const ref = await fetch(`/api/user/settings?email=${encodeURIComponent(emailFromSession)}`)
                if (ref.ok) {
                  const json = await ref.json()
                  setName(json?.user?.name ?? "")
                  setEmail(json?.user?.email ?? "")
                  setNotifEmail(!!json?.notifications?.emailUpdates)
                  setNotifPush(!!json?.notifications?.pushEnabled)
                  setNotifDigest(!!json?.notifications?.weeklyDigest)
                }
              }}
            >
              Reset account
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Deactivate your account and remove access to CampusReach.</div>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>Deactivate account</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate account?</DialogTitle>
            <DialogDescription>
              This will permanently disable access for your user. You can contact support to re-activate later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false)
                toast("Deactivation requested", { description: "This feature will be enabled soon." })
              }}
            >
              Confirm deactivate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
