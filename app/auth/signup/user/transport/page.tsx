"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [mode, setMode] = useState<"PROVIDE_OTHERS" | "SELF_ONLY" | "RIDESHARE" | "">("");
  const [radius, setRadius] = useState<number | "">(10);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/signup/user/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transportMode: mode || undefined, radiusMiles: typeof radius === "number" ? radius : undefined, transportNotes: notes || undefined }),
      });
      if (res.ok) {
        window.location.href = "/auth/signup/user/goals";
        return;
      }
      console.error("Transport save failed", await res.text());
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
              <h1 className="text-2xl font-semibold tracking-tight">Transportation</h1>
              <p className="text-sm text-foreground/70">How can you get to opportunities?</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label>Transportation mode</Label>
                  <div className="grid gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input required type="radio" name="mode" value="PROVIDE_OTHERS" checked={mode === "PROVIDE_OTHERS"} onChange={() => setMode("PROVIDE_OTHERS")} />
                      Can provide rides for others
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input required type="radio" name="mode" value="SELF_ONLY" checked={mode === "SELF_ONLY"} onChange={() => setMode("SELF_ONLY")} />
                      Can drive self only
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input required type="radio" name="mode" value="RIDESHARE" checked={mode === "RIDESHARE"} onChange={() => setMode("RIDESHARE")} />
                      Prefer CampusReach rideshare
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="radius">Desired radius (miles)</Label>
                  <Input id="radius" type="number" min={1} max={100} value={radius} onChange={(e) => setRadius(e.target.value ? Number(e.target.value) : "")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Transportation notes (optional)</Label>
                  <Input id="notes" placeholder="Any constraints or preferences" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button asChild variant="outline" type="button">
                    <Link href="/auth/signup/user/profile">Back</Link>
                  </Button>
                  <Button type="submit" disabled={submitting || !mode}>
                    {submitting ? "Saving..." : "Continue"}
                  </Button>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: "66%" }} />
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
