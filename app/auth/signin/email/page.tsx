"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type FoundUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-foreground/70">Loading…</div>}>
      <EmailSigninContent />
    </Suspense>
  );
}

function EmailSigninContent() {
  const [step, setStep] = useState<"missing" | "found" | "not_found">("missing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<FoundUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();

  async function lookupByEmail(targetEmail: string) {
    if (!targetEmail) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/users/by-email?email=${encodeURIComponent(targetEmail)}`);
      if (res.ok) {
        const data = (await res.json()) as FoundUser;
        setUser(data);
        setStep("found");
        // If name is missing, try to fetch it explicitly
        if (!data.name) {
          try {
            const nameRes = await fetch(`/api/users/name?email=${encodeURIComponent(targetEmail)}`);
            if (nameRes.ok) {
              const { name } = (await nameRes.json()) as { name: string };
              setUser((prev) => (prev ? { ...prev, name } : { id: "", email: targetEmail, name }));
            }
          } catch {}
        }
      } else if (res.status === 404) {
        setUser(null);
        setStep("not_found");
        // Attempt to get a display name anyway (may be provisioned externally)
        try {
          const nameRes = await fetch(`/api/users/name?email=${encodeURIComponent(targetEmail)}`);
          if (nameRes.ok) {
            const { name } = (await nameRes.json()) as { name: string };
            setUser({ id: "", email: targetEmail, name });
          }
        } catch {}
      } else {
        // Non-404 error: treat as not found for now
        setUser(null);
        setStep("not_found");
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const qpEmail = searchParams.get("email");
    if (qpEmail) {
      setEmail(qpEmail);
      // Fire and forget; state handles UI
      lookupByEmail(qpEmail);
    } else {
      setStep("missing");
    }
  }, [searchParams]);

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/auth/signup/user">Sign up</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              {step === "found" && (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome back, {user?.name?.split(" ")[0] || "User"}
                  </h1>
                  <p className="text-sm text-foreground/70">Enter your password or continue with Google</p>
                </>
              )}
              {(step === "not_found" || step === "missing") && (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight">Couldn&rsquo;t find that account</h1>
                  <p className="text-sm text-foreground/70">Let&rsquo;s get you on Campus Reach.</p>
                </>
              )}
            </CardHeader>
            <CardContent>
              {(step === "not_found" || step === "missing") && (
                <div className="space-y-3">
                  <Button asChild className="w-full" disabled={submitting}>
                    <Link href="/auth/signup">Create account</Link>
                  </Button>
                  <p className="text-xs text-center text-foreground/60">
                    Used the wrong email?{' '}
                    <Link href="/auth/signin" className="underline underline-offset-4">Go back</Link>
                  </p>
                </div>
              )}

              {step === "found" && (
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>Continue</Button>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-foreground/60">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={submitting}
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.691,6.053,29.082,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C33.691,6.053,29.082,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.799-1.977,13.285-5.193l-6.147-5.201C29.101,35.091,26.66,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.53,5.027C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.918,5.606 c0.001-0.001,0.002-0.001,0.003-0.002l6.147,5.201C36.971,39.121,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  <p className="text-xs text-center text-foreground/60">Signed in as {email}</p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
