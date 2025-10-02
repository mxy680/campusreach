"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [hours, setHours] = useState<number | "">(2);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/signup/user/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyHours: typeof hours === "number" ? hours : undefined }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
        return;
      }
      console.error("Goals save failed", await res.text());
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
              <h1 className="text-2xl font-semibold tracking-tight">Your goals</h1>
              <p className="text-sm text-foreground/70">How many hours per week do you plan to volunteer?</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="hours">Weekly hours goal</Label>
                  <Input id="hours" type="number" min={0} max={40} value={hours} onChange={(e) => setHours(e.target.value ? Number(e.target.value) : "")} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button asChild variant="outline" type="button">
                    <Link href="/auth/signup/user/transport">Back</Link>
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Finish"}
                  </Button>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: "100%" }} />
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
