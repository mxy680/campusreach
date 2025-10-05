"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZATION" | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { role: "VOLUNTEER" | "ORGANIZATION" | null };
          setRole(data.role ?? null);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const dashboardHref = role === "ORGANIZATION" ? "/org/dashboard" : "/user/dashboard";

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-10 md:py-16 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/15),transparent_60%)] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="border-muted/40 shadow-sm">
          <CardHeader className="pt-8 pb-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {/* 404 icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM9.75 9a.75.75 0 110 1.5.75.75 0 010-1.5zm4.5 0a.75.75 0 110 1.5.75.75 0 010-1.5zM8.5 14.25a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">The page you’re looking for doesn’t exist or was moved.</p>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="mx-auto max-w-xl space-y-6 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" onClick={() => router.back()}>Go back</Button>
                <Link href="/" className="inline-flex">
                  <Button variant="ghost">Go home</Button>
                </Link>
                <Link href={dashboardHref} className="inline-flex">
                  <Button variant="default">Go to my dashboard</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
