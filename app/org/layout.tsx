import { getUserType } from "@/lib/user-type"
import { redirect } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { OrganizationSidebar } from "@/components/organization-sidebar"

export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userType = await getUserType()

  if (userType !== "organization") {
    redirect("/auth/signin")
  }

  return (
    <SidebarProvider>
      <OrganizationSidebar />
      {children}
    </SidebarProvider>
  )
}

