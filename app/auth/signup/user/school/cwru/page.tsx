"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Sign up with CWRU SSO</h1>
              <p className="text-sm text-foreground/70">
                Use your CWRU Network ID and password. For students, employees, and alumni.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => {
                  try {
                    document.cookie = "signup_user=1; Max-Age=600; Path=/; SameSite=Lax";
                  } catch {}
                  signIn("google", { callbackUrl: "/auth/signup/user/profile" });
                }}
              >
                Continue with Single Sign-On
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
