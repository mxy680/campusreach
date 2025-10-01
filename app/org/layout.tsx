"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

export default function OrgLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = useMemo(() => {
    if (!pathname) return "Dashboard";
    // Expect paths like /org, /org/dashboard, /org/profile, etc.
    const parts = pathname.split("/").filter(Boolean);
    const afterOrg = parts.slice(parts.indexOf("org") + 1);
    const section = afterOrg[0] ?? "dashboard";
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      profile: "Profile",
      opportunities: "Opportunities",
      volunteers: "Volunteer Management",
      messaging: "Messaging",
      resources: "Resources",
      settings: "Settings",
    };
    const pretty = map[section] ?? section.replace(/-/g, " ");
    return pretty.charAt(0).toUpperCase() + pretty.slice(1);
  }, [pathname]);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-6" />
          <div className="font-medium">{title}</div>
        </header>
        <div className="flex-1 p-4">{children}</div>
      </SidebarInset>
      <Toaster position="top-right" richColors theme="light" />
    </SidebarProvider>
  );
}
