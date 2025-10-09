"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SCHOOLS: { value: string; label: string }[] = [
  { value: "cwru", label: "Case Western Reserve University" },
];

export default function UserSignupClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [school, setSchool] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const error = params.get("error");
  const [toasted, setToasted] = useState(false);

  // If the user is already onboarded, skip the signup flow entirely
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { role: "VOLUNTEER" | "ORGANIZATION" | null; profileComplete: boolean };
        if (!aborted && data?.profileComplete) {
          router.replace("/user/dashboard");
        }
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, [router]);

  // Toast errors from query string
  useEffect(() => {
    if (toasted) return;
    if (error === "school_email") {
      toast.error("Must sign up with your school email.");
      setToasted(true);
    } else if (error === "no_account") {
      toast.error("No account found for this email. Please sign up to continue.");
      setToasted(true);
    }
  }, [error, toasted]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!school) return;
    try {
      setSubmitting(true);
      router.push(`/auth/signup/user/school/${encodeURIComponent(school)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end">
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Choose your university</h1>
              <p className="text-sm text-foreground/70">Select your school to continue with signup</p>
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

                <Button type="submit" className="w-full" disabled={!school || submitting}>
                  {submitting ? "Processing..." : "Continue"}
                </Button>

                <p className="text-xs text-foreground/70 text-center">
                  Organization?{' '}
                  <Link href="/auth/signup/organization" className="text-primary underline underline-offset-4">
                    Create an account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Toaster />
    </main>
  );
}
