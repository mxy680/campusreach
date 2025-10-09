"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

export default function SignInClient() {
  const params = useSearchParams()
  const [loading, setLoading] = React.useState(false)

  const cb = params.get("callbackUrl") || "/"
  const from = params.get("from") || undefined
  const mode = params.get("mode") || undefined

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "org-invite"
              ? "Continue to join the organization with your Google account."
              : "Continue with your Google account."}
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            try {
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
              <path d="M12.45 22c2.67 0 4.91-.88 6.55-2.39l-3.2-2.48c-.89.6-2.02.95-3.35.95-2.57 0-4.75-1.73-5.53-4.06H3.59v2.55A9.55 9.55 0 0 0 12.45 22z" />
              <path d="M6.92 13.99a5.73 5.73 0 0 1 0-3.98V7.46H3.59a9.57 9.57 0 0 0 0 9.08l3.33-2.55z" />
              <path d="M12.45 5.52c1.45 0 2.74.5 3.76 1.47l2.82-2.82A9.52 9.52 0 0 0 12.45 2 9.55 9.55 0 0 0 3.59 7.46l3.33 2.55c.78-2.33 2.96-4.49 5.53-4.49z" />
            </svg>
          </span>
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>
        {from && (
          <p className="mt-2 text-[11px] text-muted-foreground">After sign-in you’ll be returned to: {from}</p>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          By continuing, you agree to our Terms and acknowledge our Privacy Policy.
        </p>
      </div>
    </main>
  )
}
