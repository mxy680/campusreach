"use client";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RestrictedPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-10 md:py-16 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/15),transparent_60%)] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="border-muted/40 shadow-sm">
          <CardHeader className="pt-8 pb-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {/* lock icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M12 1.5a4.5 4.5 0 00-4.5 4.5v3h-.75A2.25 2.25 0 004.5 11.25v7.5A2.25 2.25 0 006.75 21h10.5A2.25 2.25 0 0019.5 18.75v-7.5A2.25 2.25 0 0017.25 9H16.5V6A4.5 4.5 0 0012 1.5zm3 7.5V6A3 3 0 0012 3a3 3 0 00-3 3v3h6z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Access restricted</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Volunteer accounts must use a Case Western Reserve University email ending with
              <span className="mx-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">@case.edu</span>
            </p>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="mx-auto max-w-xl space-y-6 text-center">
              <p className="text-sm text-foreground/80">
                If you signed up with a personal email, please sign out and sign back in with your CWRU address.
              </p>

              <div className="flex justify-center">
                <Button variant="default" onClick={() => signOut({ callbackUrl: "/auth/signin/user" })}>Sign out</Button>
              </div>

              {/* Footer removed per request: org users must sign out first */}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
