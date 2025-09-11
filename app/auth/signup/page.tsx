"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        // If the user exists, redirect them to the sign-in page
        router.push("/auth/signin");
        return;
      } else {
        console.log("Lookup failed:", await res.json());
      }
    } catch (err) {
      console.error("Error calling by-email API", err);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-foreground/70">Please use your school email to continue</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" variant="default" className="w-full" disabled={submitting}>
                {submitting ? "Processing..." : "Continue"}
              </Button>
              <p className="text-xs text-foreground/70 text-center">
                Organization?{' '}
                <Link href="/auth/signup" className="text-primary underline underline-offset-4">
                  Create account
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