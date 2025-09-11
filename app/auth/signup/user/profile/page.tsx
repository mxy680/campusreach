"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [major, setMajor] = useState("");
  const [gradMonth, setGradMonth] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Build an ISO date from month/year if provided
      let graduationDate: string | undefined = undefined;
      if (gradMonth && gradYear) {
        const y = Number(gradYear);
        const m = Number(gradMonth);
        if (!Number.isNaN(y) && !Number.isNaN(m) && m >= 1 && m <= 12) {
          graduationDate = new Date(y, m - 1, 1).toISOString();
        }
      }
      const res = await fetch("/api/signup/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, pronouns, major, graduationDate }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
        return;
      }
      console.error("Profile save failed", await res.text());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/auth/signup/user">Sign up</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Set up your profile</h1>
              <p className="text-sm text-foreground/70">Tell us about yourself</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Input id="pronouns" name="pronouns" placeholder="e.g., she/her" value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input id="major" name="major" placeholder="e.g., Computer Science" value={major} onChange={(e) => setMajor(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gradMonth">Graduation month</Label>
                    <Input
                      id="gradMonth"
                      name="gradMonth"
                      placeholder="MM"
                      inputMode="numeric"
                      value={gradMonth}
                      onChange={(e) => setGradMonth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradYear">Graduation year</Label>
                    <Input
                      id="gradYear"
                      name="gradYear"
                      placeholder="YYYY"
                      inputMode="numeric"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Saving..." : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
