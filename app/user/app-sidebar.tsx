"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  { title: "Explore", url: "/user/opportunities", icon: IconHeartHandshake },
  { title: "Messaging", url: "/user/messaging", icon: IconMessage2 },
  { title: "Resources", url: "/user/resources", icon: IconHelp },
  { title: "Settings", url: "/user/settings", icon: IconSettings },
]

export function UserAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const name = session?.user?.name ?? "Volunteer"
  const email = session?.user?.email ?? ""
  const pathname = usePathname()
  const [avatar, setAvatar] = React.useState<string>(
    ((session?.user as { image?: string } | undefined)?.image) ?? "/avatars/shadcn.jpg"
  )

  React.useEffect(() => {
    if (!email) return
    fetch(`/api/user/profile?email=${encodeURIComponent(email)}`)
      .then(async (r) => {
        if (!r.ok) return
        const json = await r.json()
        const img = json?.user?.image as string | null | undefined
        if (img) setAvatar(img)
      })
      .catch(() => {})
  }, [email])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-3 pt-3">
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
      <SidebarContent className="px-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span className={pathname?.startsWith(item.url) ? "font-semibold" : undefined}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="px-3 pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-accent">
              <Avatar className="h-8 w-8 rounded-lg">
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
