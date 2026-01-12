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
      return NextResponse.json(
        { error: "Not an organization member" },
        { status: 403 }
      )
    }

    // Get organization preferences
    const org = orgMember.organization

    return NextResponse.json({
      timezone: org.timezone || "America/New_York",
      locale: org.locale || "en-US",
      defaultEventLocationTemplate: org.defaultEventLocationTemplate || "",
      defaultTimeCommitmentHours: org.defaultTimeCommitmentHours || 2,
      defaultVolunteersNeeded: org.defaultVolunteersNeeded || 10,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: "Not an organization member" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      timezone,
      locale,
      defaultEventLocationTemplate,
      defaultTimeCommitmentHours,
      defaultVolunteersNeeded,
    } = body

    // Update organization preferences
    await prisma.organization.update({
      where: { id: orgMember.organizationId },
      data: {
        timezone: timezone || null,
        locale: locale || null,
        defaultEventLocationTemplate: defaultEventLocationTemplate || null,
        defaultTimeCommitmentHours: defaultTimeCommitmentHours ? parseInt(defaultTimeCommitmentHours, 10) : null,
        defaultVolunteersNeeded: defaultVolunteersNeeded ? parseInt(defaultVolunteersNeeded, 10) : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

