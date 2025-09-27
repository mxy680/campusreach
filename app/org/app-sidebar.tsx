"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

type OrgMe = {
  user: { id: string; email: string | null; name: string | null; image: string | null; role: string }
  organization: { name: string | null }
}

const data = {
  navMain: [
    // 1. Dashboard (Home)
    { title: "Dashboard", url: "/org/dashboard", icon: IconDashboard },
    // 2. Profile / Organization Info
    { title: "Profile", url: "/org/profile", icon: IconUsers },
    // 3. Opportunities / Posts
    { title: "Opportunities", url: "/org/opportunities", icon: IconFolder },
    // 4. Volunteer Management
    { title: "Volunteer Management", url: "/org/volunteers", icon: IconListDetails },
    // 5. Messaging / Communication
    { title: "Messaging", url: "/org/messaging", icon: IconFileDescription },
    // 6. Analytics / Reports
    { title: "Analytics", url: "/org/analytics", icon: IconChartBar },
    // 7. Resources / Support
    { title: "Resources", url: "/org/resources", icon: IconHelp },
    // 8. Settings
    { title: "Settings", url: "/org/settings", icon: IconSettings },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [me, setMe] = useState<OrgMe | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/org/me", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load session")
        const json = (await res.json()) as OrgMe
        if (mounted) setMe(json)
      } catch {
        // ignore; render fallback
      } finally {
        if (mounted) setLoaded(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const orgName = me?.organization?.name ?? me?.user?.email ?? "Organization"
  const userForFooter = {
    // Show organization name on top
    name: orgName,
    email: me?.user?.email ?? "",
    avatar: me?.user?.image ?? "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              {loaded ? (
                <a href="#" className="transition-opacity duration-300 opacity-100">
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">{orgName}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 transition-opacity duration-300 opacity-100">
                  <IconInnerShadowTop className="!size-5" />
                  <Skeleton className="h-5 w-32" />
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {loaded ? (
          <div className="transition-opacity duration-300 opacity-100">
            <NavUser user={userForFooter} />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 transition-opacity duration-300 opacity-100">
            <Skeleton className="size-8 rounded-full" />
            <div className="grid gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
