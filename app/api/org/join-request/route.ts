import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, message } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      )
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: organizationId,
        userId: user.id,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 400 }
      )
    }

    // Check if there's already a pending join request
    const existingRequest = await prisma.organizationJoinRequest.findFirst({
      where: {
        organizationId: organizationId,
        userId: user.id,
        status: "PENDING",
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending join request for this organization" },
        { status: 400 }
      )
    }

    // Create join request
    const joinRequest = await prisma.organizationJoinRequest.create({
      data: {
        organizationId: organizationId,
        userId: user.id,
        email: user.email || null,
        message: message || null,
        status: "PENDING",
      },
    })

    return NextResponse.json({ success: true, joinRequest })
  } catch (error) {
    console.error("Error creating join request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

