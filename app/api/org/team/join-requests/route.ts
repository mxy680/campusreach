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
        { error: "Only the primary owner can approve/deny join requests" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { requestId, action } = body // action: "approve" or "deny"

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "requestId and action are required" },
        { status: 400 }
      )
    }

    if (action !== "approve" && action !== "deny") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'deny'" },
        { status: 400 }
      )
    }

    // Get the join request
    const joinRequest = await prisma.organizationJoinRequest.findUnique({
      where: { id: requestId },
    })

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      )
    }

    if (joinRequest.organizationId !== orgMember.organizationId) {
      return NextResponse.json(
        { error: "Join request does not belong to this organization" },
        { status: 403 }
      )
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Join request is not pending" },
        { status: 400 }
      )
    }

    // Update the join request status
    await prisma.organizationJoinRequest.update({
      where: { id: requestId },
      data: {
        status: action === "approve" ? "APPROVED" : "DECLINED",
        decidedAt: new Date(),
      },
    })

    // If approved, create organization member
    if (action === "approve") {
      // Check if user is already a member
      const existingMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId: orgMember.organizationId,
          userId: joinRequest.userId,
        },
      })

      if (!existingMember) {
        // Create member with info from join request
        // Note: We'll get name/logoUrl from the user's profile if they have one
        // For now, we'll use the email from the join request
        await prisma.organizationMember.create({
          data: {
            organizationId: orgMember.organizationId,
            userId: joinRequest.userId,
            email: joinRequest.email || null,
            name: null, // Will be updated when user logs in
            logoUrl: null, // Will be updated when user logs in
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing join request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

