"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Page() {
  const [school, setSchool] = useState("");
  const [schoolError, setSchoolError] = useState("");

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/auth/signup/user">Sign up</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Volunteer sign in</h1>
              <p className="text-sm text-foreground/70">Select your school and continue with Google</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>School</Label>
                  <Select
                    onValueChange={(v: string) => {
                      setSchoolError("");
                      setSchool(v);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cwru">Case Western Reserve University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white hover:text-white focus:text-white active:text-white border-transparent"
                  onClick={() => {
                    if (!school) {
                      setSchoolError("Please select your school");
                      return;
                    }
                    signIn("google", { callbackUrl: "/dashboard" });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" className="text-white">
                    <path fill="currentColor" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.691,6.053,29.082,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="currentColor" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C33.691,6.053,29.082,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="currentColor" d="M24,44c5.166,0,9.799-1.977,13.285-5.193l-6.147-5.201C29.101,35.091,26.66,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.53,5.027C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="currentColor" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.918,5.606 c0.001-0.001,0.002-0.001,0.003-0.002l6.147,5.201C36.971,39.121,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                  Continue with Google
                </Button>

                <p className="text-xs text-center text-foreground/60">
                  Organization?{' '}
                  <Link href="/auth/signin/organization" className="text-primary underline underline-offset-4">
                    Sign in
                  </Link>
                </p>

                {schoolError && (
                  <p className="text-xs text-destructive text-center">{schoolError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
