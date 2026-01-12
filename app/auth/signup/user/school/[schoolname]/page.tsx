"use client"

import { Suspense, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

function SchoolSignupContent() {
  const params = useParams()
  const schoolname = params.schoolname as string
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignIn = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=volunteer&school=${encodeURIComponent(schoolname)}`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error("Error signing in:", error)
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
              <h1 className="text-2xl font-semibold tracking-tight">Sign up with CWRU SSO</h1>
              <p className="text-sm text-foreground/70">
                Use your CWRU Network ID and password. For students, employees, and alumni.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? "Processing..." : "Continue with Single Sign-On"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default function SchoolSignupPage() {
  return (
    <Suspense fallback={<main className="min-h-[calc(100vh-4rem)] p-6" />}>
      <SchoolSignupContent />
    </Suspense>
  )
}

