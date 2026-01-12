import { getUserType } from "@/lib/user-type"
import { redirect } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { VolunteerSidebar } from "@/components/volunteer-sidebar"

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userType = await getUserType()

  if (userType !== "volunteer") {
    redirect("/auth/signin")
  }

  return (
    <SidebarProvider>
      <VolunteerSidebar />
      {children}
    </SidebarProvider>
  )
}

