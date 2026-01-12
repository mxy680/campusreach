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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { IconPencil, IconUpload } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type OrgMe = {
  user: { id: string; email: string | null; name: string | null; image: string | null; role: string }
  organization: { name: string | null; logoUrl: string | null } | null
}

type Preferences = {
  timezone: string
  locale: string
  defaultTimeCommitmentHours: number
  defaultVolunteersNeeded: number
}

// Common timezones
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Warsaw",
  "Europe/Amsterdam",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
]

// Common locales
const LOCALES = [
  "en-US",
  "en-GB",
  "es-ES",
  "fr-FR",
  "de-DE",
  "it-IT",
  "pt-BR",
  "ja-JP",
  "zh-CN",
  "ko-KR",
]

export default function OrganizationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [user, setUser] = useState<OrgMe | null>(null)
  const [email, setEmail] = useState("")
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingMemberName, setEditingMemberName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({
    timezone: "America/New_York",
    locale: "en-US",
    defaultTimeCommitmentHours: 2,
    defaultVolunteersNeeded: 10,
  })
  const [teamMembers, setTeamMembers] = useState<
    Array<{
      id: string
      userId: string
      name: string
      email: string
      logoUrl: string | null
      isPrimaryOwner: boolean
    }>
  >([])
  const [pendingRequests, setPendingRequests] = useState<
    Array<{
      id: string
      userId: string
      email: string
      message: string | null
    }>
  >([])
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user data
        const userRes = await fetch("/api/org/me")
        if (!userRes.ok) throw new Error("Failed to fetch user data")
        const userData = (await userRes.json()) as OrgMe
        setUser(userData)
        setEmail(userData.user.email || "")

        // Fetch preferences
        const prefsRes = await fetch("/api/org/settings")
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json()
          setPreferences({
            timezone: prefsData.timezone || "America/New_York",
            locale: prefsData.locale || "en-US",
            defaultTimeCommitmentHours: prefsData.defaultTimeCommitmentHours || 2,
            defaultVolunteersNeeded: prefsData.defaultVolunteersNeeded || 10,
          })
        }

        // Fetch team data
        const teamRes = await fetch("/api/org/team")
        if (teamRes.ok) {
          const teamData = await teamRes.json()
          setTeamMembers(teamData.teamMembers || [])
          setPendingRequests(teamData.pendingRequests || [])
          setIsPrimaryOwner(teamData.isPrimaryOwner || false)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStartEdit = (memberId: string, currentName: string) => {
    setEditingMemberId(memberId)
    setEditingMemberName(currentName)
  }

  const handleCancelEdit = () => {
    setEditingMemberId(null)
    setEditingMemberName("")
  }

  const handleSaveProfile = async () => {
    if (!editingMemberId) return

    setSavingProfile(true)
    try {
      const response = await fetch("/api/org/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingMemberName }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const updatedData = await response.json()
      setUser(updatedData)
      
      // Update the team members list
      setTeamMembers((prev) =>
        prev.map((member) =>
          member.userId === user?.user.id
            ? { ...member, name: editingMemberName }
            : member
        )
      )

      setEditingMemberId(null)
      setEditingMemberName("")
      toast.success("Name updated successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save name. Please try again.")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/org/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload avatar")
      }

      const data = await response.json()
      
      // Update the team members list
      setTeamMembers((prev) =>
        prev.map((member) =>
          member.userId === user?.user.id
            ? { ...member, logoUrl: data.url }
            : member
        )
      )

      // Update user state
      if (user) {
        setUser({
          ...user,
          user: {
            ...user.user,
            image: data.url,
          },
        })
      }

      toast.success("Avatar updated successfully!")
    } catch (error: unknown) {
      console.error("Error uploading avatar:", error)
      const message = error instanceof Error ? error.message : "Failed to upload avatar. Please try again."
      toast.error(message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update notification preferences
      const prefsResponse = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      })

      if (!prefsResponse.ok) {
        throw new Error("Failed to update preferences")
      }

      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      // Fetch organization data
      const orgRes = await fetch("/api/org/profile")
      if (!orgRes.ok) throw new Error("Failed to fetch organization data")

      const orgData = await orgRes.json()
      const data = {
        organization: orgData.organization,
        user: user,
        preferences: preferences,
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `campusreach-org-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully!")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const handleDeactivateClick = () => {
    setShowDeactivateDialog(true)
  }

  const handleDeactivateConfirm = async () => {
    setDeactivating(true)
    try {
      // Note: We might need to create a deactivate endpoint for organizations
      // For now, we'll show an error
      toast.error("Organization deactivation is not yet implemented")
      setDeactivating(false)
      setShowDeactivateDialog(false)
    } catch (error) {
      console.error("Error deactivating account:", error)
      toast.error("Failed to deactivate account. Please try again.")
      setDeactivating(false)
      setShowDeactivateDialog(false)
    }
  }

  const handleRemoveClick = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName })
    setShowRemoveDialog(true)
  }

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return

    setRemovingMember(memberToRemove.id)
    try {
      const response = await fetch(`/api/org/team?memberId=${memberToRemove.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove team member")
      }

      toast.success("Team member removed successfully")
      // Refresh team data
      const teamRes = await fetch("/api/org/team")
      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData.teamMembers || [])
      }
      setShowRemoveDialog(false)
      setMemberToRemove(null)
    } catch (error: unknown) {
      console.error("Error removing team member:", error)
      const message = error instanceof Error ? error.message : "Failed to remove team member"
      toast.error(message)
    } finally {
      setRemovingMember(null)
    }
  }

  const handleProcessJoinRequest = async (requestId: string, action: "approve" | "deny") => {
    setProcessingRequest(requestId)
    try {
      const response = await fetch("/api/org/team/join-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          action,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${action} request`)
      }

      toast.success(`Join request ${action === "approve" ? "approved" : "denied"} successfully`)
      // Refresh team data
      const teamRes = await fetch("/api/org/team")
      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData.teamMembers || [])
        setPendingRequests(teamData.pendingRequests || [])
      }
    } catch (error: unknown) {
      console.error(`Error ${action}ing join request:`, error)
      const message = error instanceof Error ? error.message : `Failed to ${action} request`
      toast.error(message)
    } finally {
      setProcessingRequest(null)
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
              <span className="font-medium">Settings</span>
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
            <span className="font-medium">Settings</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Defaults used across events, dates and formatting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, timezone: value })
                  }
                >
                  <SelectTrigger id="timezone" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale">Locale</Label>
                <Select
                  value={preferences.locale}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, locale: value })
                  }
                >
                  <SelectTrigger id="locale" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {locale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Section */}
        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
            <CardDescription>
              Manage who has access to this organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members found.</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => {
                  const isCurrentUser = member.userId === user?.user.id
                  const isEditing = editingMemberId === member.id

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10">
                            {member.logoUrl && (
                              <AvatarImage src={member.logoUrl} alt={member.name} />
                            )}
                            <AvatarFallback>
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isCurrentUser && !isEditing && (
                            <label
                              htmlFor={`avatar-upload-${member.id}`}
                              className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors"
                              title="Upload avatar"
                            >
                              <IconUpload className="h-3 w-3" />
                              <input
                                id={`avatar-upload-${member.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleUploadAvatar(file)
                                  }
                                  // Reset input
                                  e.target.value = ""
                                }}
                                disabled={uploadingAvatar}
                              />
                            </label>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isEditing && isCurrentUser ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingMemberName}
                                onChange={(e) => setEditingMemberName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveProfile()
                                  } else if (e.key === "Escape") {
                                    handleCancelEdit()
                                  }
                                }}
                                className="h-7 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="h-7 px-2"
                              >
                                {savingProfile ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={savingProfile}
                                className="h-7 px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{member.name}</p>
                              {isCurrentUser && (
                                <button
                                  onClick={() => handleStartEdit(member.id, member.name)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Edit name"
                                >
                                  <IconPencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      {!isEditing && isPrimaryOwner && !member.isPrimaryOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveClick(member.id, member.name)}
                          disabled={removingMember === member.id}
                          className="text-destructive hover:text-destructive shrink-0"
                        >
                          {removingMember === member.id ? "Removing..." : "Remove"}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Join Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pending join requests</CardTitle>
            <CardDescription>
              {isPrimaryOwner
                ? "Approve or deny requests to join your organization."
                : "No pending requests."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPrimaryOwner ? (
              <p className="text-sm text-muted-foreground">
                Only the primary owner can manage join requests.
              </p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{request.email}</p>
                      {request.message && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProcessJoinRequest(request.id, "deny")}
                        disabled={processingRequest === request.id}
                        className="text-destructive hover:text-destructive"
                      >
                        Deny
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleProcessJoinRequest(request.id, "approve")}
                        disabled={processingRequest === request.id}
                      >
                        {processingRequest === request.id ? "Processing..." : "Approve"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              These actions are irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export data</Label>
                <p className="text-sm text-muted-foreground">
                  Export a copy of your organization data (JSON).
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={exporting}
              >
                {exporting ? "Exporting..." : "Export my data"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deactivate account</Label>
                <p className="text-sm text-muted-foreground">
                  Deactivate your account and remove access to CampusReach.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeactivateClick}
                disabled={deactivating}
              >
                Deactivate account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deactivate Account Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your account? This action is irreversible and will permanently delete all your data, including:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Your profile information</li>
              <li>All events and event history</li>
              <li>Volunteer signups and communications</li>
              <li>Organization settings and preferences</li>
              <li>Notification preferences</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-destructive">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateConfirm}
              disabled={deactivating}
            >
              {deactivating ? "Deactivating..." : "Yes, deactivate my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Team Member Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from your organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false)
                setMemberToRemove(null)
              }}
              disabled={removingMember !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirm}
              disabled={removingMember !== null}
            >
              {removingMember ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}

