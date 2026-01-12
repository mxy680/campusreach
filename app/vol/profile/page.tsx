"use client"

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
import { Combobox } from "@/components/ui/combobox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { IconUpload, IconDeviceFloppy, IconUserCircle } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const schools = [
  { value: "Case Western Reserve University", label: "Case Western Reserve University" },
]

const majors = [
  { value: "Data Science", label: "Data Science" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "Environmental Science", label: "Environmental Science" },
  { value: "Public Health", label: "Public Health" },
  { value: "Business", label: "Business" },
  { value: "Education", label: "Education" },
  { value: "Biology", label: "Biology" },
  { value: "Mechanical Engineering", label: "Mechanical Engineering" },
  { value: "Nursing", label: "Nursing" },
]

const TRANSPORT_MODES = {
  PROVIDE_OTHERS: "PROVIDE_OTHERS",
  SELF_ONLY: "SELF_ONLY",
  RIDESHARE: "RIDESHARE",
} as const

export default function VolunteerProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [school, setSchool] = useState("")
  const [major, setMajor] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [phone, setPhone] = useState("")
  const [transportMode, setTransportMode] = useState<string>("")
  const [radiusMiles, setRadiusMiles] = useState(10)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [volunteerId, setVolunteerId] = useState<string | null>(null)

  // Fetch volunteer data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/vol/profile")
        if (!response.ok) throw new Error("Failed to fetch profile")
        const data = await response.json()
        const volunteer = data.volunteer

        if (volunteer) {
          setVolunteerId(volunteer.id)
          setFirstName(volunteer.firstName || "")
          setLastName(volunteer.lastName || "")
          setSchool(volunteer.school || "")
          setMajor(volunteer.major || "")
          setPhone(volunteer.phone || "")
          setTransportMode(volunteer.transportMode || "")
          setRadiusMiles(volunteer.radiusMiles || 10)
          setAvatarUrl(volunteer.image || null)

          // Extract graduation year from graduationDate
          if (volunteer.graduationDate) {
            const date = new Date(volunteer.graduationDate)
            setGraduationYear(date.getFullYear().toString())
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/vol/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          school,
          major,
          graduationYear,
          phone,
          transportMode: transportMode || null,
          radiusMiles,
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/vol/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload avatar")
      }

      const data = await response.json()
      setAvatarUrl(data.url)
      toast.success("Avatar uploaded successfully!")
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("Failed to upload avatar. Please try again.")
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ""
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
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Keep your volunteer information up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Combobox
                    options={schools}
                    value={school}
                    onValueChange={setSchool}
                    placeholder="Select your school"
                    emptyText="No school found."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduation-year">Graduation year</Label>
                  <Input
                    id="graduation-year"
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2025"
                    min="2020"
                    max="2030"
                  />
                </div>

                {/* Avatar */}
                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile picture" />
                      <AvatarFallback>
                        <IconUserCircle className="h-10 w-10 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Avatar</div>
                      <div className="text-xs text-muted-foreground">
                        PNG, JPG. 512x512 recommended.
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={uploading}
                        >
                          <label htmlFor="avatar-upload" className="cursor-pointer">
                            <IconUpload className="h-4 w-4" />
                            {uploading ? "Uploading..." : "Choose File"}
                          </label>
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Combobox
                    options={majors}
                    value={major}
                    onValueChange={setMajor}
                    placeholder="Select your major"
                    emptyText="No major found."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Transportation Options */}
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-base font-medium">How will you get to opportunities?</Label>
                <div className="mt-3">
                  <RadioGroup
                    value={transportMode}
                    onValueChange={setTransportMode}
                  >
                    <RadioGroupItem
                      value={TRANSPORT_MODES.PROVIDE_OTHERS}
                      label="I can provide transportation for myself and others (carpool)"
                    />
                    <RadioGroupItem
                      value={TRANSPORT_MODES.SELF_ONLY}
                      label="I can provide transportation for myself only"
                    />
                    <RadioGroupItem
                      value={TRANSPORT_MODES.RIDESHARE}
                      label="I'll accept CampusReach rideshare (Uber/Lyft) support"
                    />
                  </RadioGroup>
                </div>
              </div>

              {/* Preferred Radius */}
              <div>
                <Label className="text-base font-medium">Preferred radius</Label>
                <div className="mt-3">
                  <Slider
                    value={radiusMiles}
                    onValueChange={setRadiusMiles}
                    min={1}
                    max={50}
                    step={1}
                    unit="miles"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t">
              {volunteerId && (
                <Button variant="outline" asChild>
                  <a href={`/vol/${volunteerId}`}>
                    View public profile
                  </a>
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <IconDeviceFloppy className="h-4 w-4" />
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}

