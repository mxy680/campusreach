"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

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
  const { data: session } = useSession()
  const email = session?.user?.email ?? ""
  const sessionImage = session?.user?.image || null
  const [slug, setSlug] = React.useState<string>("")
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
  const [loading, setLoading] = React.useState(true)
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(sessionImage as string | null)

  const onChange = (key: keyof ProfileForm, value: string | number | boolean | File | null) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onPickAvatar(file?: File | null) {
    if (!file) return
    try {
      setUploadingAvatar(true)
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/user/avatar", { method: "POST", body: fd })
      if (!res.ok) {
        toast("Failed to upload avatar")
        return
      }
      const json = await res.json()
      if (json?.url) {
        setAvatarUrl(json.url as string)
      }
    } catch {
      toast("Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (!email) return
      const apiTransport =
        form.transportMode === "provide_others" ? "PROVIDE_OTHERS" : form.transportMode === "rideshare" ? "RIDESHARE" : "SELF_ONLY"
      // Normalize phone to E.164 if possible
      const raw = (form.phone || "").replace(/[^0-9+]/g, "")
      let phoneE164 = raw
      if (raw && !raw.startsWith("+")) {
        // Assume US if 10 digits
        const digits = raw.replace(/\D/g, "")
        if (digits.length === 10) phoneE164 = "+1" + digits
        else if (digits.length === 11 && digits.startsWith("1")) phoneE164 = "+" + digits
      }
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          profile: {
            firstName: form.firstName,
            lastName: form.lastName,
            school: form.school || undefined,
            major: form.major || undefined,
            gradYear: form.gradYear || undefined,
            phone: phoneE164 || undefined,
            transportMode: apiTransport,
            radiusMiles: form.radiusMiles,
            transportNotes: form.transportNotes || undefined,
          },
        }),
      })
      if (!res.ok) {
        console.error("Save failed", await res.text())
        toast("Failed to save profile", {
          description: "Please try again.",
        })
        return
      }
      toast("Profile saved", {
        description: "Your changes have been saved.",
      })
    } finally {
      setSaving(false)
    }
  }

  React.useEffect(() => {
    if (!email) return
    setLoading(true)
    fetch(`/api/user/profile?email=${encodeURIComponent(email)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const p = json?.profile as
          | {
              slug?: string | null
              firstName: string
              lastName: string
              school?: string
              major?: string
              gradYear?: string
              phone?: string
              transportMode: "PROVIDE_OTHERS" | "SELF_ONLY" | "RIDESHARE"
              radiusMiles: number
              transportNotes?: string
            }
          | null
        if (p) {
          const existingSlug = (p.slug as string) || ""
          setSlug(existingSlug)
          // Ensure a public slug exists so the button works without an extra save
          if (!existingSlug) {
            try {
              const res = await fetch("/api/user/profile/slug", { method: "POST" })
              if (res.ok) {
                const j = await res.json()
                if (j?.slug) setSlug(j.slug as string)
              }
            } catch {
              // ignore
            }
          }
          setForm((f) => ({
            ...f,
            firstName: p.firstName ?? "",
            lastName: p.lastName ?? "",
            school: p.school ?? "",
            major: p.major ?? "",
            gradYear: p.gradYear ?? "",
            phone: p.phone ?? "",
            transportMode:
              p.transportMode === "PROVIDE_OTHERS" ? "provide_others" : p.transportMode === "RIDESHARE" ? "rideshare" : "self_only",
            radiusMiles: p.radiusMiles ?? 5,
            transportNotes: p.transportNotes ?? "",
          }))
          // Keep avatar preview in sync with session DB value
          if (sessionImage) setAvatarUrl(sessionImage)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [email, sessionImage])

  return (
    <main className="p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Profile</CardTitle>
          <CardDescription>Keep your volunteer information up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
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
              <Label>School</Label>
              <Select value={form.school} onValueChange={(v) => onChange("school", v)}>
                <SelectTrigger size="default" className="w-full">
                  <SelectValue placeholder="Select your school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Case Western Reserve University">Case Western Reserve University</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Major</Label>
              <Select value={form.major} onValueChange={(v) => onChange("major", v)}>
                <SelectTrigger size="default" className="w-full">
                  <SelectValue placeholder="Select your major" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accounting">Accounting</SelectItem>
                  <SelectItem value="Anthropology">Anthropology</SelectItem>
                  <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Biomedical Engineering">Biomedical Engineering</SelectItem>
                  <SelectItem value="Business Administration">Business Administration</SelectItem>
                  <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Economics">Economics</SelectItem>
                  <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                  <SelectItem value="Environmental Science">Environmental Science</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Information Systems">Information Systems</SelectItem>
                  <SelectItem value="International Studies">International Studies</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                  <SelectItem value="Neuroscience">Neuroscience</SelectItem>
                  <SelectItem value="Nursing">Nursing</SelectItem>
                  <SelectItem value="Philosophy">Philosophy</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Political Science">Political Science</SelectItem>
                  <SelectItem value="Psychology">Psychology</SelectItem>
                  <SelectItem value="Public Health">Public Health</SelectItem>
                  <SelectItem value="Sociology">Sociology</SelectItem>
                  <SelectItem value="Statistics">Statistics</SelectItem>
                  <SelectItem value="Supply Chain Management">Supply Chain Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grad">Graduation year</Label>
              <Input id="grad" type="number" min={2024} max={2035} placeholder="e.g. 2027" value={form.gradYear} onChange={(e) => onChange("gradYear", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 555-5555"
                pattern="^(\+\d{10,15}|\(?\d{3}\)?[-\.\s]?\d{3}[-\.\s]?\d{4})$"
                title="Enter a valid phone number (e.g., (555) 555-5555 or +15555555555)"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border bg-muted">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="avatar" fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">No avatar</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Avatar</div>
                    <div className="text-xs text-muted-foreground truncate">PNG, JPG. 512×512 recommended.</div>
                    {uploadingAvatar && (<div className="text-[11px] text-muted-foreground">Uploading…</div>)}
                  </div>
                </div>
                <div className="sm:justify-self-end">
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null
                      onChange("avatarFile", f)
                      onPickAvatar(f)
                      e.currentTarget.value = ""
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
                  />
                </div>
              </div>
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
              {slug ? (
                <Button variant="outline" asChild size="sm">
                  <Link href={`/v/${slug}`} target="_blank" rel="noreferrer">View public profile</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>View public profile</Button>
              )}
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
            </div>
            {/* Datalists removed in favor of Select dropdowns */}
          </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
