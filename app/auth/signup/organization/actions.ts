"use server"

import { prisma } from "@/lib/prisma"

export async function getOrganizations() {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return organizations.map((org) => ({
      value: org.id,
      label: org.name || "Unnamed Organization",
    }))
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return []
  }
}

