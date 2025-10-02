"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function Page() {
  const router = useRouter();
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
        router.push("/auth/signup/user/transport");
        return;
      }
      console.error("Profile save failed", await res.text());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6" />

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
                    <Input id="firstName" name="firstName" placeholder="e.g., Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" placeholder="e.g., Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Input id="pronouns" name="pronouns" placeholder="e.g., she/her" value={pronouns} onChange={(e) => setPronouns(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Select value={major} onValueChange={(v) => setMajor(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your major" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accounting">Accounting</SelectItem>
                      <SelectItem value="Anthropology">Anthropology</SelectItem>
                      <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Biomedical Engineering">Biomedical Engineering</SelectItem>
                      <SelectItem value="Business Administration">Business Administration</SelectItem>
                      <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Economics">Economics</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                      <SelectItem value="Environmental Science">Environmental Science</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Information Systems">Information Systems</SelectItem>
                      <SelectItem value="International Studies">International Studies</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      <SelectItem value="Neuroscience">Neuroscience</SelectItem>
                      <SelectItem value="Nursing">Nursing</SelectItem>
                      <SelectItem value="Philosophy">Philosophy</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Political Science">Political Science</SelectItem>
                      <SelectItem value="Psychology">Psychology</SelectItem>
                      <SelectItem value="Public Health">Public Health</SelectItem>
                      <SelectItem value="Sociology">Sociology</SelectItem>
                      <SelectItem value="Statistics">Statistics</SelectItem>
                      <SelectItem value="Supply Chain Management">Supply Chain Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gradMonth">Graduation month</Label>
                    <Input
                      id="gradMonth"
                      name="gradMonth"
                      placeholder="MM"
                      inputMode="numeric"
                      title="Enter a valid month as MM (01-12)"
                      value={gradMonth}
                      onChange={(e) => setGradMonth(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradYear">Graduation year</Label>
                    <Input
                      id="gradYear"
                      name="gradYear"
                      placeholder="YYYY"
                      inputMode="numeric"
                      title="Enter a 4-digit year"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* No transport or goals on this step */}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button asChild variant="outline" type="button">
                    <Link href="/auth/signup/user">Back</Link>
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Continue"}
                  </Button>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: "33%" }} />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
