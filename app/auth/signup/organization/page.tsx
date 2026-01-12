"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { createClient } from "@/lib/supabase/client"
import { getOrganizations } from "./actions"

function OrganizationSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<{ value: string; label: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    getOrganizations().then(setOrganizations)
  }, [])

  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success")
    
    if (error === "email_exists") {
      toast.error("Email already registered", {
        description: "This email is already associated with a volunteer account.",
      })
      // Clean up the URL
      router.replace("/auth/signup/organization")
    } else if (success === "join_request_sent") {
      toast.success("Join request submitted", {
        description: "Your request to join the organization has been submitted. The organization owner will review it.",
      })
      // Clean up the URL
      router.replace("/auth/signup/organization")
    }
  }, [searchParams, router])

  const handleSignIn = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=organization`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error("Error signing in:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRequest = async () => {
    if (!selectedOrg) {
      toast.error("Please select an organization")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=org-join&organizationId=${encodeURIComponent(selectedOrg)}`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error("Error signing in:", error)
      toast.error("Failed to initiate join request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end">
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Organization signup</h1>
              <p className="text-sm text-foreground/70">
                Start hosting volunteer events.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Organization</h2>
                  <Combobox
                    options={organizations}
                    value={selectedOrg}
                    onValueChange={setSelectedOrg}
                    placeholder="Select organization..."
                    emptyText="No organizations found."
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleJoinRequest}
                  disabled={loading || !selectedOrg}
                >
                  {loading ? "Processing..." : "Request to join organization"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="white"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="white"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="white"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="white"
                      />
                    </svg>
                    Create organization with Google
                  </>
                )}
              </Button>

              <p className="text-xs text-foreground/70 text-center">
                Volunteer?{" "}
                <Link href="/auth/signup/volunteer" className="text-primary underline underline-offset-4">
                  Create account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default function OrganizationSignupPage() {
  return (
    <Suspense fallback={<main className="min-h-[calc(100vh-4rem)] p-6" />}>
      <OrganizationSignupContent />
    </Suspense>
  )
}

