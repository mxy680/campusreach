"use client"

import * as React from "react"
const SaveButton = React.lazy(() => import("./SaveButton"))
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Save as SaveIcon, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

type OrgProfile = {
  name: string
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
  contacts: Array<{ name: string; email?: string; phone?: string; role?: string }>
}

type OrgProfileApi = {
  id: string
  slug: string | null
  name: string
  logoUrl: string | null
  description: string | null
  mission: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  categories: string[] | null
  website: string | null
  twitter?: string | null
  instagram?: string | null
  facebook?: string | null
  linkedin?: string | null
  contacts: Array<{ id: string; name: string; email: string | null; phone: string | null; role: string | null }>
}

const CATEGORY_OPTIONS = [
  "Youth",
  "Environment",
  "Health",
  "Education",
  "Community",
  "Arts",
  "Sports",
  "Animals",
  "Elderly",
  "Food",
  "Technology",
  "Advocacy",
]

export default function Page() {
  const [userImage, setUserImage] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false)
  const [orgId, setOrgId] = React.useState<string | null>(null)
  const [slug, setSlug] = React.useState<string>("")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [data, setData] = React.useState<OrgProfile>(() => ({
    name: "",
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
    contacts: [],
  }))

  const MAX_DESC = 500
  const MAX_MISSION = 300

  const logoPreview = React.useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile)
    return userImage
  }, [logoFile, userImage])

  React.useEffect(() => {
    return () => {
      if (logoFile) URL.revokeObjectURL(logoPreview)
    }
  }, [logoFile, logoPreview])

  // Load current user (for fallback avatar image) via NextAuth session
  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/auth/session")
        if (!r.ok) return
        const j = await r.json()
        const img = (j?.user?.image as string | undefined) || ""
        if (img) setUserImage(img)
      } catch {}
    })()
  }, [])

  // No longer prefilling organization.logoUrl from user image; avatar display reads from User.image

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
    ;(async () => {
      try {
        const r1 = await fetch("/api/orgs")
        if (!r1.ok) return
        const j1 = await r1.json()
        const first = (j1?.data ?? [])[0]?.id as string | undefined
        if (!first) return
        setOrgId(first)
        const r2 = await fetch(`/api/org/profile?orgId=${encodeURIComponent(first)}`)
        if (!r2.ok) return
        const j2 = await r2.json()
        const org: OrgProfileApi | undefined = j2?.data as OrgProfileApi | undefined
        const p: Partial<OrgProfile> = {
          name: org?.name ?? "",
          logoUrl: org?.logoUrl ?? undefined,
          description: org?.description ?? undefined,
          mission: org?.mission ?? undefined,
          contactName: org?.contactName ?? undefined,
          contactEmail: org?.contactEmail ?? undefined,
          contactPhone: org?.contactPhone ?? undefined,
          categories: org?.categories ?? undefined,
          website: org?.website ?? undefined,
          twitter: org?.twitter ?? undefined,
          instagram: org?.instagram ?? undefined,
          facebook: org?.facebook ?? undefined,
          linkedin: org?.linkedin ?? undefined,
        }
        const fetchedSlug = org?.slug ?? undefined
        setData({
          name: p?.name ?? "",
          logoUrl: p?.logoUrl ?? "",
          description: p?.description ?? "",
          mission: p?.mission ?? "",
          contactName: p?.contactName ?? "",
          contactEmail: p?.contactEmail ?? "",
          contactPhone: p?.contactPhone ?? "",
          categories: Array.isArray(p?.categories) ? p.categories! : [],
          website: p?.website ?? "",
          twitter: p?.twitter ?? "",
          instagram: p?.instagram ?? "",
          facebook: p?.facebook ?? "",
          linkedin: p?.linkedin ?? "",
          contacts: Array.isArray(org?.contacts)
            ? org!.contacts.map((c) => ({
                name: c.name || "",
                email: c.email || "",
                phone: c.phone || "",
                role: c.role || "",
              }))
            : [],
        })
        setSlug(fetchedSlug || "")
      } catch {
        // no-op
      } finally {
        setLoading(false)
      }
    })()
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
    } finally {
      setSaving(false)
    }
  }

  async function saveContacts() {
    if (!orgId) return
    setSaving(true)
    try {
      const res = await fetch("/api/org/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, profile: { contacts: data.contacts } }),
      })
      if (!res.ok) {
        toast("Failed to save contact", { description: "Please try again." })
        return
      }
      toast("Contact saved")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Organization profile</h1>
          <p className="text-sm text-muted-foreground">Add details and links to help students recognize your org.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {loading ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : (
            <>
              <React.Suspense fallback={<Button size="sm" disabled>Loading…</Button>}>
                <SaveButton saving={saving} onSave={onSave} />
              </React.Suspense>
              {slug ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/o/${slug}`} target="_blank" rel="noreferrer">View public profile</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  View public profile
                </Button>
              )}
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
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={data.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Your organization name"
                maxLength={120}
              />
            </div>
            {/* Logo */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 rounded-full overflow-hidden bg-muted">
                  {logoPreview ? (
                    <AvatarImage
                      key={logoPreview}
                      src={`${logoPreview}`}
                      alt="Organization logo"
                      className="h-full w-full object-cover"
                      loading="eager"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <AvatarFallback>LOGO</AvatarFallback>
                  )}
                </Avatar>
                <div className="grid gap-1">
                  <Label className="text-sm">Logo</Label>
                  <p className="text-xs text-muted-foreground">PNG, JPG. 512x512 recommended.</p>
                </div>
              </div>
              <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0] || null
                    setLogoFile(f)
                    if (f) {
                      // Upload to /api/user/avatar -> Spaces, then reflect returned URL
                      ;(async () => {
                        try {
                          setUploadingAvatar(true)
                          const fd = new FormData()
                          fd.append("file", f)
                          const res = await fetch("/api/user/avatar", { method: "POST", body: fd })
                          if (!res.ok) throw new Error("Upload failed")
                          const j = (await res.json()) as { url?: string }
                          if (j?.url) {
                            setUserImage(j.url)
                          }
                        } catch {
                          // keep silent here; a toast is already used elsewhere; optional to add one
                          
                        } finally {
                          setUploadingAvatar(false)
                        }
                      })()
                    }
                  }}
                  className={`w-full sm:max-w-xs`}
                />
                {uploadingAvatar && <span className="text-xs text-muted-foreground">Uploading…</span>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <textarea
                id="org-description"
                value={data.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update("description", e.target.value)}
                placeholder="Brief description of your organization"
                maxLength={MAX_DESC}
                className={`w-full min-h-28 rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background`}
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
                placeholder="Your mission and impact goals"
                maxLength={MAX_MISSION}
                className={`w-full min-h-24 rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background`}
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
                      onClick={() => toggleCategory(tag)}
                      className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                        active ? "bg-secondary border-secondary text-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
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
              <Input id="contact-name" value={data.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" value={data.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="name@org.org" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input id="contact-phone" value={data.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={data.website} onChange={(e) => update("website", e.target.value)} placeholder="https://www.example.org" />
              <p className="text-[10px] text-muted-foreground">Link to your main website or Linktree.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input id="twitter" value={data.twitter || ""} onChange={(e) => update("twitter", e.target.value)} placeholder="https://x.com/yourorg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={data.instagram || ""} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/yourorg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" value={data.facebook || ""} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/yourorg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={data.linkedin || ""} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/company/yourorg" />
            </div>

            {/* Additional contacts */}
            <div className="md:col-span-2 pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Additional contacts</div>
                  <div className="text-sm text-muted-foreground">Add secondary points of contact.</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      contacts: [...prev.contacts, { name: "", email: "", phone: "", role: "" }],
                    }))
                  }
                >
                  + Add contact
                </Button>
              </div>
              <div className="space-y-3">
                {data.contacts.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-3 md:grid-cols-5 items-end">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={c.name}
                        onChange={(e) =>
                          setData((prev) => {
                            const arr = [...prev.contacts]
                            arr[idx] = { ...arr[idx], name: e.target.value }
                            return { ...prev, contacts: arr }
                          })
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={c.email || ""}
                        onChange={(e) =>
                          setData((prev) => {
                            const arr = [...prev.contacts]
                            arr[idx] = { ...arr[idx], email: e.target.value }
                            return { ...prev, contacts: arr }
                          })
                        }
                        placeholder="name@org.org"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={c.phone || ""}
                        onChange={(e) =>
                          setData((prev) => {
                            const arr = [...prev.contacts]
                            arr[idx] = { ...arr[idx], phone: e.target.value }
                            return { ...prev, contacts: arr }
                          })
                        }
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2 md:col-span-2">
                      <div className="flex-1 space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={c.role || ""}
                          onChange={(e) =>
                            setData((prev) => {
                              const arr = [...prev.contacts]
                              arr[idx] = { ...arr[idx], role: e.target.value }
                              return { ...prev, contacts: arr }
                            })
                          }
                          placeholder="Coordinator"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          title="Save contact"
                          aria-label="Save contact"
                          onClick={saveContacts}
                          disabled={!c.name || saving}
                        >
                          <SaveIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          title="Remove contact"
                          aria-label="Remove contact"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              contacts: prev.contacts.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
