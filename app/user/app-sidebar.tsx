"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import {
  IconDashboard,
  IconHeartHandshake,
  IconMessage2,
  IconHelp,
  IconSettings,
  IconUserCircle,
  IconBell,
  IconLogout,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { title: "Dashboard", url: "/user/dashboard", icon: IconDashboard },
  { title: "Profile", url: "/user/profile", icon: IconUserCircle },
  { title: "Opportunities", url: "/user/opportunities", icon: IconHeartHandshake },
  { title: "Messaging", url: "/user/messaging", icon: IconMessage2 },
  { title: "Resources", url: "/user/resources", icon: IconHelp },
  { title: "Settings", url: "/user/settings", icon: IconSettings },
]

export function UserAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const name = session?.user?.name ?? "Volunteer"
  const email = session?.user?.email ?? ""
  const avatar = ((session?.user as { image?: string } | undefined)?.image) ?? "/avatars/shadcn.jpg"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconHeartHandshake className="!size-5" />
                <span className="text-base font-semibold">Volunteer</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-accent">
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="rounded-lg">VL</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">{email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56 rounded-lg" side="right" align="end" sideOffset={4}>
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/user/profile">
                  <IconUserCircle />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/user/settings">
                  <IconSettings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/user/messaging">
                  <IconBell />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void signOut({ callbackUrl: "/" })
              }}
            >
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
