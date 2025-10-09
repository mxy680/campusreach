"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignOutClient() {
  const params = useSearchParams();
  const [started, setStarted] = useState(false);
  const callbackUrl = useMemo(() => {
    const cb = params.get("callbackUrl");
    if (cb && /^\//.test(cb)) return cb; // allow only same-origin relative paths for safety
    return "/auth/signin";
  }, [params]);

  useEffect(() => {
    if (started) return;
    setStarted(true);
    const t = setTimeout(() => {
      signOut({ callbackUrl });
    }, 150);
    return () => clearTimeout(t);
  }, [started, callbackUrl]);

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Signing you out</h1>
              <p className="text-sm text-muted-foreground">This will take just a moment…</p>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-orange-500 text-white hover:bg-orange-600"
                onClick={() => signOut({ callbackUrl })}
              >
                Sign out now
              </Button>
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Changed your mind?{" "}
                <Link href={callbackUrl || "/auth/signin"} className="text-primary underline underline-offset-4">Go back</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
