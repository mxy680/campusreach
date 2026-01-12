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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type VolunteerMe = {
  user: { id: string; email: string | null; name: string | null; image: string | null; role: string }
}

type NotificationPreferences = {
  emailUpdates: boolean
  weeklyDigest: boolean
}

export default function VolunteerSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [user, setUser] = useState<VolunteerMe | null>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailUpdates: true,
    weeklyDigest: true,
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user data
        const userRes = await fetch("/api/vol/me")
        if (!userRes.ok) throw new Error("Failed to fetch user data")
        const userData = (await userRes.json()) as VolunteerMe
        setUser(userData)
        setFullName(userData.user.name || "")
        setEmail(userData.user.email || "")

        // Fetch notification preferences
        const prefsRes = await fetch("/api/vol/settings")
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json()
          setPreferences({
            emailUpdates: prefsData.emailUpdates ?? true,
            weeklyDigest: prefsData.weeklyDigest ?? true,
          })
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

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update name if changed
      if (fullName !== user?.user.name) {
        const response = await fetch("/api/vol/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update profile")
        }
      }

      // Update notification preferences
      const prefsResponse = await fetch("/api/vol/settings", {
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
      const response = await fetch("/api/vol/export-data")
      if (!response.ok) {
        throw new Error("Failed to export data")
      }

      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `campusreach-data-${new Date().toISOString().split("T")[0]}.json`
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
      const response = await fetch("/api/vol/deactivate", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to deactivate account")
      }

      toast.success("Account deactivated successfully")
      // Redirect to sign in page
      window.location.href = "/auth/signin"
    } catch (error) {
      console.error("Error deactivating account:", error)
      toast.error("Failed to deactivate account. Please try again.")
      setDeactivating(false)
      setShowDeactivateDialog(false)
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
        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Update your account and notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-4">
              <Label>Email preferences</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="email-updates"
                    checked={preferences.emailUpdates}
                    onChange={(e) =>
                      setPreferences({ ...preferences, emailUpdates: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-2 focus:ring-offset-2 cursor-pointer"
                  />
                  <label
                    htmlFor="email-updates"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Email me about new opportunities and reminders
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="weekly-digest"
                    checked={preferences.weeklyDigest}
                    onChange={(e) =>
                      setPreferences({ ...preferences, weeklyDigest: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-2 focus:ring-offset-2 cursor-pointer"
                  />
                  <label
                    htmlFor="weekly-digest"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Send a weekly email digest
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
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
                  Export a copy of your data (JSON).
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
              <li>All event signups and history</li>
              <li>Time entries and logged hours</li>
              <li>Event ratings and comments</li>
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
    </SidebarInset>
  )
}

