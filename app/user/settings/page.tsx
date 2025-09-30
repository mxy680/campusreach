"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [pwd, setPwd] = React.useState("")
  const [pwd2, setPwd2] = React.useState("")
  const [notifEmail, setNotifEmail] = React.useState(true)
  const [notifPush, setNotifPush] = React.useState(false)
  const [notifDigest, setNotifDigest] = React.useState(true)
  const [privacyDirectory, setPrivacyDirectory] = React.useState(false)
  const [privacyShareStats, setPrivacyShareStats] = React.useState(true)

  const onSave = async () => {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      // TODO: wire to API
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 space-y-4">
      {/* Account */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Account</CardTitle>
          <CardDescription>Update your basic profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd">Change password</Label>
              <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="New password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd2">Confirm password</Label>
              <Input id="pwd2" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="Confirm password" />
            </div>
            <div className="md:col-span-2 flex items-center justify-end">
              <Button onClick={onSave} disabled={saving || (!!pwd && pwd !== pwd2)}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you’d like to hear about updates.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control how your information is shared.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={privacyDirectory} onChange={(e) => setPrivacyDirectory(e.target.checked)} />
            Show my name in organization volunteer directories
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={privacyShareStats} onChange={(e) => setPrivacyShareStats(e.target.checked)} />
            Share my hours and skills with CampusReach partners
          </label>
          <div className="md:col-span-2 flex items-center justify-end">
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save privacy settings"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>These actions are irreversible.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">Deactivate your account and remove access to CampusReach.</div>
          <Button variant="destructive" disabled title="Temporarily disabled">Deactivate account</Button>
        </CardContent>
      </Card>
    </main>
  )
}
