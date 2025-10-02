"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
              <h1 className="text-2xl font-semibold tracking-tight">Organization sign in</h1>
              <p className="text-sm text-foreground/70">Continue with Google</p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => signIn("google", { callbackUrl: "/org/dashboard" })}>
                Continue with Google
              </Button>
              <p className="mt-3 text-xs text-center text-foreground/60">
                Volunteer?{" "}
                <Link href="/auth/signin/user" className="text-primary underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}