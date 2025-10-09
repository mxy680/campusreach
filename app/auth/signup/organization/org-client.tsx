"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown as ChevronsUpDownIcon, Check as CheckIcon } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function OrgSignupClient() {
  const params = useSearchParams();
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultText, setResultText] = useState<string>("");
  const [autoRan, setAutoRan] = useState(false);

  // Load organizations
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/orgs", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { data: { id: string; name: string }[] };
        if (!aborted) setOrgs(data.data || []);
      } catch {}
    })();
    return () => { aborted = true };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter(o => o.name.toLowerCase().includes(q));
  }, [query, orgs]);

  const submitJoinInner = useCallback(async (orgId?: string) => {
    const targetId = orgId || selectedOrg?.id;
    if (!targetId) return;
    try {
      setSubmitting(true);
      setResultText("");
      try { document.cookie = "signup_intent=1; Max-Age=600; Path=/; SameSite=Lax"; } catch {}
      const res = await fetch("/api/org/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: targetId }),
      });
      if (res.status === 401) {
        try { document.cookie = "signup_intent=1; Max-Age=600; Path=/; SameSite=Lax"; } catch {}
        try { document.cookie = `org_join_orgId=${encodeURIComponent(targetId)}; Max-Age=600; Path=/; SameSite=Lax`; } catch {}
        const cb = `/auth/signup/organization?orgId=${encodeURIComponent(targetId)}&auto=1`;
        return signIn("google", { callbackUrl: cb });
      }
      let data: Partial<{ ok: boolean; pending: boolean; alreadyMember: boolean }> = {};
      try { data = await res.json(); } catch {}
      if (data.alreadyMember) {
        setResultText("You are already a member of this organization.");
        return;
      }
      if (data.pending || data.ok) {
        return signOut({ callbackUrl: "/auth/signup/organization?joined=1" });
      }
      setResultText("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [selectedOrg]);

  const submitJoin = useCallback((orgId?: string) => {
    void submitJoinInner(orgId);
  }, [submitJoinInner]);

  // Auto submit join after Google if returned with orgId&auto=1
  useEffect(() => {
    const orgId = params.get("orgId");
    const auto = params.get("auto");
    if (!auto || autoRan) return;
    if (orgId) {
      const found = orgs.find(o => o.id === orgId) || null;
      if (found) {
        setSelectedOrg(found);
        submitJoin(found.id);
        setAutoRan(true);
      }
    }
  }, [params, orgs, autoRan, submitJoin]);

  // Toast success after server-side join handled via callback
  useEffect(() => {
    const joined = params.get("joined");
    if (joined === "1") {
      toast.success("Request submitted. You can sign in after an admin approves.");
    }
  }, [params]);

  function onCreateOrg() {
    try {
      document.cookie = "org_join_orgId=; Max-Age=0; Path=/; SameSite=Lax";
      document.cookie = "signup_intent=1; Max-Age=600; Path=/; SameSite=Lax";
    } catch {}
    return signIn("google", { callbackUrl: "/auth/signup/organization/start" });
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent">
      <header className="mb-6 flex justify-end">
        <Button asChild variant="default">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </header>

      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Organization signup</h1>
              <p className="text-sm text-muted-foreground">Search an organization to request access or create a new one</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                      onClick={() => setOpen(!open)}
                    >
                      {selectedOrg ? selectedOrg.name : "Select organization..."}
                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <div className="p-2">
                      <input
                        autoFocus
                        placeholder="Search organization..."
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-56 overflow-auto py-1 text-sm">
                      {filtered.length === 0 && (
                        <div className="px-3 py-2 text-muted-foreground">No organizations found.</div>
                      )}
                      {filtered.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className="flex w-full cursor-pointer items-center px-3 py-2 text-left hover:bg-accent"
                          onMouseDown={(e) => { e.preventDefault(); setSelectedOrg(o); setQuery(""); setOpen(false); }}
                        >
                          <CheckIcon className={`mr-2 h-4 w-4 ${selectedOrg?.id === o.id ? "opacity-100" : "opacity-0"}`} />
                          {o.name}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button variant="outline" className="w-full mt-3" disabled={!selectedOrg || submitting} onClick={() => submitJoin()}>
                {submitting ? "Submitting..." : "Request to join organization"}
              </Button>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button className="w-full inline-flex items-center justify-center gap-2" variant="default" onClick={onCreateOrg}>
                <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M21.35 11.1h-8.9v2.98h5.1c-.22 1.3-.93 2.4-1.98 3.14l3.2 2.48c1.87-1.73 2.95-4.28 2.95-7.38 0-.64-.06-1.25-.17-1.83z" />
                    <path d="M12.45 22c2.67 0 4.91-.88 6.55-2.39l-3.2-2.48c-.89 .6-2.02 .95-3.35 .95-2.57 0-4.75-1.73-5.53-4.06H3.59v2.55A9.55 9.55 0 0 0 12.45 22z" />
                    <path d="M6.92 13.99a5.73 5.73 0 0 1 0-3.98V7.46H3.59a9.57 9.57 0 0 0 0 9.08l3.33-2.55z" />
                    <path d="M12.45 5.52c1.45 0 2.74 .5 3.76 1.47l2.82-2.82A9.52 9.52 0 0 0 12.45 2 9.55 9.55 0 0 0 3.59 7.46l3.33 2.55c.78-2.33 2.96-4.49 5.53-4.49z" />
                  </svg>
                </span>
                Create organization with Google
              </Button>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Volunteer? {" "}
                <Link href="/auth/signup/user" className="text-primary underline underline-offset-4">Create account</Link>
              </p>
              {resultText && (
                <p className="mt-3 text-xs text-center text-foreground/70">{resultText}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
