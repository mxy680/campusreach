"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [data, setData] = React.useState<OrgProfile>(() => ({
    logoUrl: "",
    description: "Tell students about your organization and what you do.",
    mission: "Share your mission and impact goals.",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    categories: ["Community"],
    website: "",
    twitter: "",
    instagram: "",
    facebook: "",
    linkedin: "",
  }))

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

  return (
    <main className="p-4">
      <div className="mb-3 flex items-center justify-end gap-2">
        {!editing ? (
          <Button size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => { setLogoFile(null); setEditing(false) }}>Cancel</Button>
            <Button size="sm" onClick={() => { setEditing(false) }}>Save Changes</Button>
          </>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
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
                  className="max-w-xs"
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
                className={`w-full min-h-24 rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!editing ? "opacity-50 cursor-not-allowed bg-muted" : "bg-background"}`}
              />
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
                className={`w-full min-h-24 rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!editing ? "opacity-50 cursor-not-allowed bg-muted" : "bg-background"}`}
              />
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
                      className={
                        active
                          ? "rounded-md border bg-secondary px-2 py-1 text-sm"
                          : "rounded-md border px-2 py-1 text-sm text-muted-foreground"
                      }
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
              {data.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {data.categories.map((c) => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact + Social combined */}
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Primary contact</Label>
              <Input id="contact-name" value={data.contactName} disabled={!editing} onChange={(e) => update("contactName", e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" value={data.contactEmail} disabled={!editing} onChange={(e) => update("contactEmail", e.target.value)} placeholder="name@org.org" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input id="contact-phone" value={data.contactPhone} disabled={!editing} onChange={(e) => update("contactPhone", e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={data.website} disabled={!editing} onChange={(e) => update("website", e.target.value)} placeholder="https://www.example.org" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input id="twitter" value={data.twitter || ""} disabled={!editing} onChange={(e) => update("twitter", e.target.value)} placeholder="https://x.com/yourorg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={data.instagram || ""} disabled={!editing} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/yourorg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" value={data.facebook || ""} disabled={!editing} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/yourorg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={data.linkedin || ""} disabled={!editing} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/company/yourorg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
