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
        organization: {
          include: {
            members: {
              orderBy: { createdAt: "asc" },
            },
            joinRequests: {
              where: { status: "PENDING" },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })

    if (!orgMember) {
      return NextResponse.json(
        { error: "Not an organization member" },
        { status: 403 }
      )
    }

    // Get the primary owner (first member created)
    const primaryOwnerId = orgMember.organization.members[0]?.userId

    // Format team members
    const teamMembers = orgMember.organization.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.name || "Unknown",
      email: member.email || "",
      logoUrl: member.logoUrl,
      isPrimaryOwner: member.userId === primaryOwnerId,
      createdAt: member.createdAt,
    }))

    // Format pending join requests
    const pendingRequests = orgMember.organization.joinRequests.map((request) => ({
      id: request.id,
      userId: request.userId,
      email: request.email || "",
      message: request.message,
      createdAt: request.createdAt,
    }))

    return NextResponse.json({
      teamMembers,
      pendingRequests,
      isPrimaryOwner: user.id === primaryOwnerId,
    })
  } catch (error) {
    console.error("Error fetching team data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
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
        organization: {
          include: {
            members: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })

    if (!orgMember) {
      return NextResponse.json(
        { error: "Not an organization member" },
        { status: 403 }
      )
    }

    // Check if user is primary owner
    const primaryOwnerId = orgMember.organization.members[0]?.userId
    if (user.id !== primaryOwnerId) {
      return NextResponse.json(
        { error: "Only the primary owner can remove team members" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      )
    }

    // Prevent removing the primary owner
    const memberToRemove = orgMember.organization.members.find(
      (m) => m.id === memberId
    )

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    if (memberToRemove.userId === primaryOwnerId) {
      return NextResponse.json(
        { error: "Cannot remove the primary owner" },
        { status: 400 }
      )
    }

    // Remove the member
    await prisma.organizationMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

