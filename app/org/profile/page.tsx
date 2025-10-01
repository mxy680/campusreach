"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

type OrgProfile = {
  logoUrl: string
  description: string
  mission: string
  contactName: string
  contactEmail: string
  contactPhone: string
  categories: string[]
  website: string
  twitter?: string
  instagram?: string
  facebook?: string
  linkedin?: string
}

const CATEGORY_OPTIONS = [
  "Youth",
  "Environment",
  "Health",
  "Education",
  "Community",
  "Arts",
  "Sports",
]

export default function Page() {
  const [editing, setEditing] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [data, setData] = React.useState<OrgProfile>(() => ({
    logoUrl: "",
    description: "",
    mission: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    categories: [],
    website: "",
    twitter: "",
    instagram: "",
    facebook: "",
    linkedin: "",
  }))

  const MAX_DESC = 500
  const MAX_MISSION = 300

  const logoPreview = React.useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile)
    return data.logoUrl
  }, [logoFile, data.logoUrl])

  React.useEffect(() => {
    return () => {
      if (logoFile) URL.revokeObjectURL(logoPreview)
    }
  }, [logoFile, logoPreview])

  function update<K extends keyof OrgProfile>(key: K, value: OrgProfile[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function toggleCategory(tag: string) {
    setData((prev) => {
      const has = prev.categories.includes(tag)
      return { ...prev, categories: has ? prev.categories.filter((t) => t !== tag) : [...prev.categories, tag] }
    })
  }

  // Load orgId and profile
  React.useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const r1 = await fetch("/api/orgs", { signal: ctrl.signal })
        if (!r1.ok) return
        const j1 = await r1.json()
        const first = (j1?.data ?? [])[0]?.id as string | undefined
        if (!first) return
        setOrgId(first)
        const r2 = await fetch(`/api/org/profile?orgId=${encodeURIComponent(first)}`, { signal: ctrl.signal })
        if (!r2.ok) return
        const j2 = await r2.json()
        const p: Partial<OrgProfile> = (j2?.data ?? {}) as Partial<OrgProfile>
        setData({
          logoUrl: p?.logoUrl ?? "",
          description: p?.description ?? "",
          mission: p?.mission ?? "",
          contactName: p?.contactName ?? "",
          contactEmail: p?.contactEmail ?? "",
          contactPhone: p?.contactPhone ?? "",
          categories: Array.isArray(p?.categories) ? p.categories : [],
          website: p?.website ?? "",
          twitter: p?.twitter ?? "",
          instagram: p?.instagram ?? "",
          facebook: p?.facebook ?? "",
          linkedin: p?.linkedin ?? "",
        })
      } finally {
        setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [])

  async function onSave() {
    if (!orgId) return
    setSaving(true)
    try {
      // TODO: upload logoFile to storage and set data.logoUrl; for now, ignore file and keep URL
      const res = await fetch("/api/org/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, profile: data }),
      })
      if (!res.ok) {
        toast("Failed to save", { description: "Please try again." })
        return
      }
      toast("Profile saved")
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Organization profile</h1>
          <p className="text-sm text-muted-foreground">Add details and links to help students recognize your org.</p>
        </div>
        <div className="flex items-center gap-2">
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : !editing ? (
          <Button size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => { setLogoFile(null); setEditing(false) }}>Cancel</Button>
            <Button size="sm" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
          </>
        )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Basic information</CardTitle>
            <CardDescription>Logo, description, mission, and categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={logoPreview || undefined} alt="Organization logo" />
                  <AvatarFallback>LOGO</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <Label className="text-sm">Logo</Label>
                  <p className="text-xs text-muted-foreground">PNG, JPG. 512x512 recommended.</p>
                </div>
              </div>
              <div className="ml-auto">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={!editing}
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0] || null
                    setLogoFile(f)
                  }}
                  className={`max-w-xs ${!editing ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <textarea
                id="org-description"
                value={data.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update("description", e.target.value)}
                disabled={!editing}
                placeholder="Brief description of your organization"
                maxLength={MAX_DESC}
                className={`w-full min-h-28 rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!editing ? "opacity-50 cursor-not-allowed bg-muted" : "bg-background"}`}
              />
              <div className="flex justify-end text-[10px] text-muted-foreground">{data.description.length}/{MAX_DESC}</div>
            </div>

            {/* Mission */}
            <div className="space-y-2">
              <Label htmlFor="org-mission">Mission statement</Label>
              <textarea
                id="org-mission"
                value={data.mission}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update("mission", e.target.value)}
                disabled={!editing}
                placeholder="Your mission and impact goals"
                maxLength={MAX_MISSION}
                className={`w-full min-h-24 rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!editing ? "opacity-50 cursor-not-allowed bg-muted" : "bg-background"}`}
              />
              <div className="flex justify-end text-[10px] text-muted-foreground">{data.mission.length}/{MAX_MISSION}</div>
            </div>

            {/* Categories inside Basic */}
            <div className="space-y-2">
              <Label>Categories / Tags</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((tag) => {
                  const active = data.categories.includes(tag)
                  return (
                    <button
                      type="button"
                      key={tag}
                      disabled={!editing}
                      onClick={() => toggleCategory(tag)}
                      className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                        active ? "bg-secondary border-secondary text-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                      } ${!editing ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
              {/* Badges removed per request */}
            </div>
          </CardContent>
        </Card>

        {/* Contact + Social combined */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Contact & links</CardTitle>
            <CardDescription>Primary contact and social presence</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Primary contact</Label>
              <Input id="contact-name" value={data.contactName} disabled={!editing} onChange={(e) => update("contactName", e.target.value)} placeholder="Name" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" value={data.contactEmail} disabled={!editing} onChange={(e) => update("contactEmail", e.target.value)} placeholder="name@org.org" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input id="contact-phone" value={data.contactPhone} disabled={!editing} onChange={(e) => update("contactPhone", e.target.value)} placeholder="(555) 123-4567" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={data.website} disabled={!editing} onChange={(e) => update("website", e.target.value)} placeholder="https://www.example.org" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
              <p className="text-[10px] text-muted-foreground">Link to your main website or Linktree.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input id="twitter" value={data.twitter || ""} disabled={!editing} onChange={(e) => update("twitter", e.target.value)} placeholder="https://x.com/yourorg" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={data.instagram || ""} disabled={!editing} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/yourorg" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" value={data.facebook || ""} disabled={!editing} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/yourorg" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={data.linkedin || ""} disabled={!editing} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/company/yourorg" className={!editing ? "bg-muted opacity-80 cursor-not-allowed" : undefined} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
