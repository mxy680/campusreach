"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { UserAppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = useMemo(() => {
    if (!pathname) return "Dashboard";
    const parts = pathname.split("/").filter(Boolean);
    const afterUser = parts.slice(parts.indexOf("user") + 1);
    const section = afterUser[0] ?? "dashboard";
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      opportunities: "Explore",
      messaging: "Messaging",
      resources: "Resources",
      settings: "Settings",
      profile: "Profile",
    };
    const pretty = map[section] ?? section.replace(/-/g, " ");
    return pretty.charAt(0).toUpperCase() + pretty.slice(1);
  }, [pathname]);

  return (
    <SessionProvider>
      <SidebarProvider>
        <UserAppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-6" />
            <div className="font-medium">{title}</div>
          </header>
          <div className="flex-1 p-4">{children}</div>
          <Toaster position="top-right" richColors />
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
