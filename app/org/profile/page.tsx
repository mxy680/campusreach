"use client"

import Image from "next/image"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconUpload, IconDeviceFloppy, IconTrash, IconUserCircle, IconExternalLink } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"

const CATEGORIES = [
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

interface OrganizationContact {
  id?: string
  name: string
  email: string
  phone: string
  role: string
}

export default function OrganizationProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [mission, setMission] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [twitter, setTwitter] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [additionalContacts, setAdditionalContacts] = useState<OrganizationContact[]>([])

  // Fetch organization data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/org/profile")
        if (!response.ok) throw new Error("Failed to fetch profile")
        const data = await response.json()
        const org = data.organization

        if (org) {
          setOrgId(org.id || null)
          setOrgName(org.name || "")
          setDescription(org.description || "")
          setMission(org.mission || "")
          setSelectedCategories(org.categories || [])
          setContactName(org.contactName || "")
          setContactEmail(org.contactEmail || "")
          setContactPhone(org.contactPhone || "")
          setWebsite("") // Website field doesn't exist in schema yet
          setTwitter(org.twitter || "")
          setInstagram(org.instagram || "")
          setFacebook(org.facebook || "")
          setLinkedin(org.linkedin || "")
          setLogoUrl(org.logoUrl || null)
          setAdditionalContacts(
            org.contacts?.map((c: { id: string; name: string | null; email: string | null; phone: string | null; role: string | null }) => ({
              id: c.id,
              name: c.name || "",
              email: c.email || "",
              phone: c.phone || "",
              role: c.role || "",
            })) || []
          )
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const handleAddContact = () => {
    setAdditionalContacts([
      ...additionalContacts,
      { name: "", email: "", phone: "", role: "" },
    ])
  }

  const handleDeleteContact = (index: number) => {
    setAdditionalContacts(additionalContacts.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/org/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: orgName,
          description,
          mission,
          categories: selectedCategories,
          contactName,
          contactEmail,
          contactPhone,
          twitter,
          instagram,
          facebook,
          linkedin,
          contacts: additionalContacts,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save profile")
      }

      toast.success("Profile saved successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="flex items-center gap-2">
              <span className="font-medium">Profile</span>
            </div>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-2">
            <span className="font-medium">Profile</span>
          </div>
        </div>
        <div className="px-4 flex items-center gap-2">
          {orgId && (
            <Button variant="outline" asChild>
              <Link href={`/org/${orgId}`} target="_blank">
                <IconExternalLink className="h-4 w-4" />
                View public profile
              </Link>
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <IconDeviceFloppy className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left Section: Basic information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>
                Logo, description, mission, and categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organization name */}
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Organization name"
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Organization logo"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <IconUserCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">Logo</div>
                    <div className="text-xs text-muted-foreground">
                      PNG, JPG. 512x512 recommended. Max 5MB.
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={uploading}
                      >
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <IconUpload className="h-4 w-4" />
                          {uploading ? "Uploading..." : "Choose File"}
                        </label>
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          setUploading(true)
                          try {
                            const formData = new FormData()
                            formData.append("file", file)

                            const response = await fetch("/api/org/upload-logo", {
                              method: "POST",
                              body: formData,
                            })

                            if (!response.ok) {
                              const error = await response.json()
                              throw new Error(error.error || "Failed to upload logo")
                            }

                            const data = await response.json()
                            setLogoUrl(data.url)
                            toast.success("Logo uploaded successfully!")
                          } catch (error) {
                            console.error("Error uploading logo:", error)
                            toast.error("Failed to upload logo. Please try again.")
                          } finally {
                            setUploading(false)
                            // Reset input
                            e.target.value = ""
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Brief description of your organization"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
                <div className="text-right text-xs text-muted-foreground">
                  {description.length}/500
                </div>
              </div>

              {/* Mission statement */}
              <div className="space-y-2">
                <Label htmlFor="mission">Mission statement</Label>
                <textarea
                  id="mission"
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Your mission and impact goals"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  maxLength={300}
                />
                <div className="text-right text-xs text-muted-foreground">
                  {mission.length}/300
                </div>
              </div>

              {/* Categories/Tags */}
              <div className="space-y-2">
                <Label>Categories/Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        selectedCategories.includes(category)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Section: Contact & links */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & links</CardTitle>
              <CardDescription>
                Primary contact and social presence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary contact */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Primary contact</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="name@org.org"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="(555)123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-website">Website</Label>
                      <Input
                        id="contact-website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://www.example.org"
                      />
                      <p className="text-xs text-muted-foreground">
                        Link to your main website or Linktree.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Social Media Links</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://x.com/yourorg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/yourorg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        type="url"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="https://facebook.com/yourorg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/company/you"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional contacts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Additional contacts</h3>
                    <p className="text-xs text-muted-foreground">
                      Add secondary points of contact.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddContact}
                  >
                    + Add contact
                  </Button>
                </div>
                <div className="space-y-3">
                  {additionalContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-end border-b pb-3 last:border-0"
                    >
                      <div className="col-span-3 space-y-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                          placeholder="Full name"
                          value={contact.name}
                          onChange={(e) => {
                            const updated = [...additionalContacts]
                            updated[index].name = e.target.value
                            setAdditionalContacts(updated)
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          placeholder="name@org"
                          value={contact.email}
                          onChange={(e) => {
                            const updated = [...additionalContacts]
                            updated[index].email = e.target.value
                            setAdditionalContacts(updated)
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          type="tel"
                          placeholder="(555)123-4"
                          value={contact.phone}
                          onChange={(e) => {
                            const updated = [...additionalContacts]
                            updated[index].phone = e.target.value
                            setAdditionalContacts(updated)
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Role</Label>
                        <Input
                          placeholder="Coordinator"
                          value={contact.role}
                          onChange={(e) => {
                            const updated = [...additionalContacts]
                            updated[index].role = e.target.value
                            setAdditionalContacts(updated)
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2 flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          <IconDeviceFloppy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteContact(index)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}

