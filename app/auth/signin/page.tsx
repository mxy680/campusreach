"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// School options dictionary
const SCHOOLS: { value: string; label: string }[] = [
  { value: "cwru", label: "Case Western Reserve University" },
];

export default function Page() {
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!school && !email) return; // require at least one
    try {
      setSubmitting(true);
      if (school) {
        router.push(`/auth/signin/${encodeURIComponent(school)}`);
        return;
      }
      if (email) {
        router.push(`/auth/signin/email?email=${encodeURIComponent(email)}`);
        return;
      }
    } finally {
      setSubmitting(false);
    }
  }

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
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-foreground/70">Choose your school or use email to continue</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label>School</Label>
                  <Select onValueChange={(v: string) => setSchool(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOLS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-foreground/60">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Processing..." : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
