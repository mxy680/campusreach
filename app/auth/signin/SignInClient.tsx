"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function SignInClient() {
  const params = useSearchParams()
  const [loading, setLoading] = React.useState(false)

  const cb = params.get("callbackUrl") || "/"
  const mode = params.get("mode") || undefined

  React.useEffect(() => {
    const err = params.get("error")
    if (err === "org_pending") {
      toast.error("Your request is pending approval. You can sign in after an admin approves.")
    }
  }, [params])

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end">
        <Button asChild variant="default">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
      </header>
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                {mode === "org-invite"
                  ? "Continue to join the organization with your Google account."
                  : "Continue with your Google account."}
              </p>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  try {
                    try {
                      // Clear any stale volunteer/org-intent cookies to avoid misrouting
                      document.cookie = "signup_user=; Max-Age=0; Path=/; SameSite=Lax";
                      document.cookie = "org_join_orgId=; Max-Age=0; Path=/; SameSite=Lax";
                    } catch {}
                    await signIn("google", { callbackUrl: cb })
                  } finally {
                    setLoading(false)
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M21.35 11.1h-8.9v2.98h5.1c-.22 1.3-.93 2.4-1.98 3.14l3.2 2.48c1.87-1.73 2.95-4.28 2.95-7.38 0-.64-.06-1.25-.17-1.83z" />
                    <path d="M12.45 22c2.67 0 4.91-.88 6.55-2.39l-3.2-2.48c-.89 .6-2.02 .95-3.35 .95-2.57 0-4.75-1.73-5.53-4.06H3.59v2.55A9.55 9.55 0 0 0 12.45 22z" />
                    <path d="M6.92 13.99a5.73 5.73 0 0 1 0-3.98V7.46H3.59a9.57 9.57 0 0 0 0 9.08l3.33-2.55z" />
                    <path d="M12.45 5.52c1.45 0 2.74 .5 3.76 1.47l2.82-2.82A9.52 9.52 0 0 0 12.45 2 9.55 9.55 0 0 0 3.59 7.46l3.33 2.55c.78-2.33 2.96-4.49 5.53-4.49z" />
                  </svg>
                </span>
                {loading ? "Redirecting…" : "Continue with Google"}
              </button>
              <p className="mt-4 text-[11px] text-muted-foreground text-center">
                By continuing, you agree to our Terms and acknowledge our Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </main>
  )
}
