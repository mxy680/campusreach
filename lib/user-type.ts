"use server"

import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export type UserType = "volunteer" | "organization" | null

export async function getUserType(): Promise<UserType> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Check if user is an organization member
  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  })

  if (orgMember) {
    return "organization"
  }

  // Check if user is a volunteer
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: user.id },
  })

  if (volunteer) {
    return "volunteer"
  }

  return null
}

export async function getUserData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  if (orgMember) {
    return {
      type: "organization" as const,
      organization: orgMember.organization,
      membership: orgMember,
      user,
    }
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: user.id },
  })

  if (volunteer) {
    return {
      type: "volunteer" as const,
      volunteer,
      user,
    }
  }

  return null
}

