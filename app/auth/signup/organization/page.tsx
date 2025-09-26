"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const error = searchParams.get("error");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/signup/organization/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        // Immediately sign in so the profile API is authorized
        await signIn("credentials", { email, password, redirect: false });
        router.push("/auth/signup/organization/start");
        return;
      }
      console.error("Credentials signup failed", await res.text());
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
              <h1 className="text-2xl font-semibold tracking-tight">Create an organization</h1>
              <p className="text-sm text-foreground/70">Sign up with email</p>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-sm text-destructive border border-destructive/40 bg-destructive/5 rounded-md p-3 mb-4 text-center">
                  An account with this email already exists. Please sign in instead.
                </div>
              )}
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="staff@company.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password to use email sign-in"
                    value={password}
                    onChange={(e) => {
                      setPasswordError("");
                      setPassword(e.target.value);
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setPasswordError("");
                      setConfirmPassword(e.target.value);
                    }}
                    required
                  />
                </div>

                {passwordError && (
                  <p className="text-xs text-destructive text-center">{passwordError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    submitting || !email || !password || !confirmPassword || password !== confirmPassword
                  }
                >
                  {submitting ? "Processing..." : "Create account"}
                </Button>

                

                <p className="text-xs text-foreground/70 text-center">
                  Volunteer?{" "}
                  <Link href="/auth/signup/user" className="text-primary underline underline-offset-4">Create account</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
