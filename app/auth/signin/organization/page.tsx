"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [credSubmitting, setCredSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) {
      setEmailError("Please enter your email");
      return;
    }

  async function onCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setEmailError(!email ? "Please enter your email" : "");
      return;
    }
    try {
      setCredSubmitting(true);
      const res = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/org/dashboard",
        redirect: true,
      });
      return res;
    } finally {
      setCredSubmitting(false);
    }
  }
    try {
      setSubmitting(true);
      router.push(`/auth/signin/email?email=${encodeURIComponent(email)}`);
    } finally {
      setSubmitting(false);
    }
  }

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
              <p className="text-sm text-foreground/70">Use your organization email to continue</p>
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

                {emailError && (
                  <p className="text-xs text-destructive text-center">{emailError}</p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Processing..." : "Continue"}
                </Button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-foreground/60">or sign in with password</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form className="space-y-3" onSubmit={onCredentials}>
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
                  <Button type="submit" className="w-full" disabled={credSubmitting}>
                    {credSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>

                <p className="text-xs text-center text-foreground/60">
                  Volunteer?{" "}
                  <Link href="/auth/signin/user" className="text-primary underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
