"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"
import {
  IconDashboard,
  IconUser,
  IconFolder,
  IconUsers,
  IconFileDescription,
  IconHelp,
  IconSettings,
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
import { usePathname } from "next/navigation"

type OrgMe = {
  user: { id: string; email: string | null; name: string | null; image: string | null; role: string }
  organization: { name: string | null; logoUrl?: string | null } | null
}

type OrganizationProfile = {
  organization: {
    name: string | null
    description: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    logoUrl: string | null
  }
}

const data = {
  navMain: [
    { title: "Dashboard", url: "/org", icon: IconDashboard },
    { title: "Profile", url: "/org/profile", icon: IconUser },
    { title: "Opportunities", url: "/org/opportunities", icon: IconFolder },
    { title: "Volunteer Management", url: "/org/volunteers", icon: IconUsers },
    { title: "Messaging", url: "/org/messaging", icon: IconFileDescription },
    { title: "Resources", url: "/org/resources", icon: IconHelp, disabled: true },
    { title: "Settings", url: "/org/settings", icon: IconSettings },
  ],
}

export function OrganizationSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [me, setMe] = useState<OrgMe | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [profileIncompleteReason, setProfileIncompleteReason] = useState("")
  const [hoursNotVerified, setHoursNotVerified] = useState(false)
  const [hoursNotVerifiedReason, setHoursNotVerifiedReason] = useState("")

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

    // Check profile completeness
    ;(async () => {
      try {
        const res = await fetch("/api/org/profile", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as OrganizationProfile
        const org = data.organization
        
        if (mounted && org) {
          const missingFields: string[] = []
          if (!org.name) missingFields.push("name")
          if (!org.description) missingFields.push("description")
          if (!org.contactName) missingFields.push("contact name")
          if (!org.contactEmail) missingFields.push("contact email")
          if (!org.contactPhone) missingFields.push("contact phone")
          if (!org.logoUrl) missingFields.push("logo")
          
          if (missingFields.length > 0) {
            setProfileIncomplete(true)
            setProfileIncompleteReason("Incomplete profile")
          } else {
            setProfileIncomplete(false)
            setProfileIncompleteReason("")
          }
        }
      } catch {
        // ignore
      }
    })()

    // Check hours verification status (always check, not just on volunteers page)
    ;(async () => {
      try {
        // Fetch all signups for all past events
        const signupsRes = await fetch("/api/org/volunteers/verification-status", { cache: "no-store" })
        if (!signupsRes.ok) {
          if (mounted) {
            setHoursNotVerified(false)
            setHoursNotVerifiedReason("")
          }
          return
        }

        const data = await signupsRes.json()
        const unverifiedCount = data.unverifiedCount || 0

        if (mounted) {
          if (unverifiedCount > 0) {
            setHoursNotVerified(true)
            setHoursNotVerifiedReason(
              `${unverifiedCount} volunteer${unverifiedCount > 1 ? "s" : ""} with unverified hours`
            )
          } else {
            setHoursNotVerified(false)
            setHoursNotVerifiedReason("")
          }
        }
      } catch {
        // ignore
        if (mounted) {
          setHoursNotVerified(false)
          setHoursNotVerifiedReason("")
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [pathname])

  const orgName = me?.organization?.name || "Organization"
  const userForFooter = {
    name: orgName,
    email: me?.user?.email ?? "",
    avatar: me?.organization?.logoUrl || "",
  }

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              {loaded ? (
                <a href="#" className="transition-opacity duration-300 opacity-100">
                  <Building2 className="!size-5" />
                  <span className="text-base font-semibold">
                    {me?.organization?.name || "Organization"}
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2 transition-opacity duration-300 opacity-100">
                  <Building2 className="!size-5" />
                  <Skeleton className="h-5 w-24" />
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {loaded ? (
          <div className="transition-opacity duration-300 opacity-100">
            <NavMain 
              items={data.navMain} 
              showScheduleEvent={true}
              profileIncomplete={profileIncomplete}
              profileIncompleteReason={profileIncompleteReason}
              hoursNotVerified={hoursNotVerified}
              hoursNotVerifiedReason={hoursNotVerifiedReason}
            />
          </div>
        ) : (
          <div className="transition-opacity duration-300 opacity-100">
            <div className="px-2 py-2">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2 px-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="p-1">
        {loaded ? (
          <div className="transition-opacity duration-300 opacity-100">
            <NavUser user={userForFooter} />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-1 transition-opacity duration-300 opacity-100">
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid gap-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
