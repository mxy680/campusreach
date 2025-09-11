"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center">
          <Image src="/logos/cwru-logo.png" alt="CWRU logo" width={160} height={32} />
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/auth/signup/user">Sign up</Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in with CWRU SSO</h1>
              <p className="text-sm text-foreground/70">
                Use your CWRU Network ID and password. For students, employees, and alumni.
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Continue with Single Sign-On</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
