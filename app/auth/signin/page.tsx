"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "no_account") {
      toast.error("Account not found", {
        description: "No account found with this email. Please sign up first.",
      })
      // Clean up the URL
      router.replace("/auth/signin")
    }
  }, [searchParams, router])

  const handleSignIn = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
    <main className="min-h-screen p-2 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-1 flex justify-end">
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/auth/signup/volunteer">Sign up</Link>
        </Button>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <div className="w-full max-w-sm">
          <Card className="bg-white border-border shadow-lg py-5 gap-0">
            <CardHeader className="text-center pb-0 pt-1.5 px-6">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Continue with your Google account.
              </p>
            </CardHeader>
            <CardContent className="space-y-2 pb-3 px-6 pt-4">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
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
                    Continue with Google
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms
                </Link>{" "}
                and acknowledge our{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-6" />}>
      <SignInContent />
    </Suspense>
  )
}

