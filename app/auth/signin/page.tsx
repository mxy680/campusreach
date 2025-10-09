import { Suspense } from "react"
import SignInClient from "./SignInClient"

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6"><div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm"><div className="h-5 w-24 bg-muted rounded" /></div></div>}>
      <SignInClient />
    </Suspense>
  )
}
