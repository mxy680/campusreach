import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get organization member record
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: true,
      },
    })

    if (!orgMember) {
      return NextResponse.json({ error: "Not an organization member" }, { status: 403 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: orgMember.name || user.user_metadata?.name || user.user_metadata?.full_name || null,
        image: orgMember.logoUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        role: "member", // You can expand this based on your needs
      },
      organization: {
        name: orgMember.organization.name,
        logoUrl: orgMember.organization.logoUrl,
      },
    })
  } catch (error) {
    console.error("Error fetching org data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get organization member record
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
    })

    if (!orgMember) {
      return NextResponse.json({ error: "Not an organization member" }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (name !== undefined) {
      // Update organization member name
      await prisma.organizationMember.update({
        where: { id: orgMember.id },
        data: { name: name || null },
      })
    }

    // Return updated member data
    const updatedMember = await prisma.organizationMember.findFirst({
      where: { id: orgMember.id },
      include: {
        organization: true,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: updatedMember!.name || user.user_metadata?.name || user.user_metadata?.full_name || null,
        image: updatedMember!.logoUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        role: "member",
      },
      organization: {
        name: updatedMember!.organization.name,
        logoUrl: updatedMember!.organization.logoUrl,
      },
    })
  } catch (error) {
    console.error("Error updating org member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

