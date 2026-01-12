"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  IconDashboard,
  IconUser,
  IconHeartHandshake,
  IconHeartFilled,
  IconMessage,
  IconHelpCircle,
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

type VolunteerMe = {
  user: { id: string; email: string | null; name: string | null; image: string | null; role: string }
}

type VolunteerProfile = {
  volunteer: {
    school: string | null
    major: string | null
    graduationDate: string | null
    phone: string | null
    image: string | null
  }
}

const data = {
  navMain: [
    { title: "Dashboard", url: "/vol", icon: IconDashboard },
    { title: "Profile", url: "/vol/profile", icon: IconUser },
    { title: "Explore", url: "/vol/explore", icon: IconHeartHandshake },
    { title: "Messaging", url: "/vol/messaging", icon: IconMessage },
    { title: "Resources", url: "/vol/resources", icon: IconHelpCircle, disabled: true },
    { title: "Settings", url: "/vol/settings", icon: IconSettings },
  ],
}

export function VolunteerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [me, setMe] = useState<VolunteerMe | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [profileIncompleteReason, setProfileIncompleteReason] = useState("")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/vol/me", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load session")
        const json = (await res.json()) as VolunteerMe
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
        const res = await fetch("/api/vol/profile", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as VolunteerProfile
        const volunteer = data.volunteer
        
        if (mounted && volunteer) {
          const missingFields: string[] = []
          if (!volunteer.school) missingFields.push("school")
          if (!volunteer.major) missingFields.push("major")
          if (!volunteer.graduationDate) missingFields.push("graduation year")
          if (!volunteer.phone) missingFields.push("phone")
          if (!volunteer.image) missingFields.push("profile picture")
          
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

    return () => {
      mounted = false
    }
  }, [])

  const userName = me?.user?.name ?? me?.user?.email ?? "Volunteer"
  const userForFooter = {
    name: userName,
    email: me?.user?.email ?? "",
    avatar: me?.user?.image || "",
  }

  return (
    <Sidebar variant="inset" collapsible="offcanvas" className="border-r" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              {loaded ? (
                <a href="#" className="transition-opacity duration-300 opacity-100">
                  <IconHeartFilled className="!size-5 text-primary" />
                  <span className="text-base font-semibold">Volunteer</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 transition-opacity duration-300 opacity-100">
                  <Skeleton className="h-5 w-5 rounded" />
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
              showScheduleEvent={false}
              profileIncomplete={profileIncomplete}
              profileIncompleteReason={profileIncompleteReason}
            />
          </div>
        ) : (
          <div className="transition-opacity duration-300 opacity-100">
            <div className="px-2 py-2">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2 px-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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

