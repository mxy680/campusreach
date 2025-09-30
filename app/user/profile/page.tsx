"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type ProfileForm = {
  firstName: string
  lastName: string
  school: string
  major: string
  gradYear: string
  phone: string
  transportMode: "provide_others" | "self_only" | "rideshare"
  radiusMiles: number
  avatarFile?: File | null
  transportNotes: string
}

export default function Page() {
  const [form, setForm] = React.useState<ProfileForm>({
    firstName: "",
    lastName: "",
    school: "",
    major: "",
    gradYear: "",
    phone: "",
    transportMode: "self_only",
    radiusMiles: 5,
    avatarFile: null,
    transportNotes: "",
  })
  const [saving, setSaving] = React.useState(false)

  const onChange = (key: keyof ProfileForm, value: string | number | boolean | File | null) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      // TODO: Wire to API
      await new Promise((r) => setTimeout(r, 600))
      alert("Profile saved (demo)")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Profile</CardTitle>
          <CardDescription>Keep your volunteer information up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first">First name</Label>
              <Input id="first" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last">Last name</Label>
              <Input id="last" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input id="school" placeholder="e.g. CWRU" value={form.school} onChange={(e) => onChange("school", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input id="major" placeholder="e.g. Biology" value={form.major} onChange={(e) => onChange("major", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grad">Graduation year</Label>
              <Input id="grad" type="number" min={2024} max={2035} placeholder="e.g. 2027" value={form.gradYear} onChange={(e) => onChange("gradYear", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="(555) 555-5555" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="avatar">Avatar</Label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => onChange("avatarFile", e.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              />
            </div>

            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-medium">How will you get to opportunities?</legend>
              <ul className="grid gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <input
                    id="mode-provide-others"
                    type="radio"
                    name="transportMode"
                    value="provide_others"
                    checked={form.transportMode === "provide_others"}
                    onChange={(e) => onChange("transportMode", e.target.value)}
                    className="h-4 w-4 accent-foreground"
                  />
                  <Label htmlFor="mode-provide-others">I can provide transportation for myself and others (carpool)</Label>
                </li>
                <li className="flex items-center gap-2">
                  <input
                    id="mode-self-only"
                    type="radio"
                    name="transportMode"
                    value="self_only"
                    checked={form.transportMode === "self_only"}
                    onChange={(e) => onChange("transportMode", e.target.value)}
                    className="h-4 w-4 accent-foreground"
                  />
                  <Label htmlFor="mode-self-only">I can provide transportation for myself only</Label>
                </li>
                <li className="flex items-center gap-2">
                  <input
                    id="mode-rideshare"
                    type="radio"
                    name="transportMode"
                    value="rideshare"
                    checked={form.transportMode === "rideshare"}
                    onChange={(e) => onChange("transportMode", e.target.value)}
                    className="h-4 w-4 accent-foreground"
                  />
                  <Label htmlFor="mode-rideshare">I&apos;ll accept CampusReach rideshare (Uber/Lyft) support</Label>
                </li>
              </ul>
            </fieldset>

            {/* Pickup address removed: all pickups occur at designated locations */}

            <div className="md:col-span-2 grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="radius">Preferred radius</Label>
                <span className="text-xs text-muted-foreground">{form.radiusMiles} miles</span>
              </div>
              <input
                id="radius"
                type="range"
                min={1}
                max={25}
                value={form.radiusMiles}
                onChange={(e) => onChange("radiusMiles", Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded bg-muted"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-1">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
