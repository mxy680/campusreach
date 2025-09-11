"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
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
              <p className="text-sm text-foreground/70">Enter your organization details to get started</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input id="org-name" name="orgName" placeholder="Campus Reach Club" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Organization email</Label>
                  <Input id="org-email" name="orgEmail" type="email" placeholder="club@university.edu" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" name="industry" placeholder="Education" required />
                </div>

                <p className="text-[11px] leading-snug text-foreground/60 text-center">
                  By clicking &quot;Create account&quot;, I agree to the Campus Reach{' '}
                  <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>{' '}
                  and have read the{' '}
                  <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
                </p>

                <Button type="submit" className="w-full">Create account</Button>

                <p className="text-xs text-foreground/70 text-center">
                  Volunteer?{' '}
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
