"use client";
import { useState } from "react";
import Link from "next/link";
// no router needed for simple credentials submit
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Error as ErrorBanner } from "@/components/ui/error";
import { signIn } from "next-auth/react";
import type { SignInResponse } from "next-auth/react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string>("");

  // Single form submit: sign in with credentials
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setEmailError(!email ? "Please enter your email" : "");
      return;
    }
    try {
      setSubmitting(true);
      // Check if the email belongs to an ORGANIZATION account first
      const res = await fetch(`/api/auth/check-org?email=${encodeURIComponent(email)}`);
      const data = (await res.json()) as { exists: boolean };
      if (!data.exists) {
        setToast("No organization found for this email");
        setTimeout(() => setToast(""), 3000);
        return;
      }
      const result: SignInResponse | undefined = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result && result.error) {
        setToast("Incorrect email or password");
        setTimeout(() => setToast(""), 3000);
        return;
      }
      // Successful login
      window.location.href = "/org/dashboard";
    } finally {
      setSubmitting(false);
    }
  }

  // Remove separate credentials handler; using form submit

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/auth/signup/organization">Sign up</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Organization sign in</h1>
              <p className="text-sm text-foreground/70">Enter your email and password</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="staff@company.org"
                    value={email}
                    onChange={(e) => {
                      setEmailError("");
                      setEmail(e.target.value);
                    }}
                  />
                </div>

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

                {emailError && (
                  <p className="text-xs text-destructive text-center">{emailError}</p>
                )}

                <Button type="submit" className="w-full" disabled={submitting || !email || !password}>
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>

                <p className="text-xs text-center text-foreground/60">
                  Volunteer?{" "}
                  <Link href="/auth/signin/user" className="text-primary underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </form>

              {toast && (
                <div className="mt-3 flex justify-center text-xs">
                  <ErrorBanner label="Error" size="small">
                    {toast}
                  </ErrorBanner>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}