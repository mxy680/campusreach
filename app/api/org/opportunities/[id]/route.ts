import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      title,
      description,
      dateTime,
      location,
      volunteersNeeded,
      timeCommitment,
      notes,
      skills,
    } = body

    // Validate required fields
    if (!title || !description || !dateTime || !location || !volunteersNeeded) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if event exists and belongs to organization
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: id,
        organizationId: orgMember.organizationId,
      },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      )
    }

    // Parse dateTime
    const startsAt = new Date(dateTime)
    if (isNaN(startsAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: id },
      data: {
        title,
        shortDescription: description,
        startsAt,
        location,
        volunteersNeeded: parseInt(volunteersNeeded, 10),
        timeCommitmentHours: timeCommitment
          ? parseFloat(timeCommitment)
          : null,
        notes: notes || null,
        specialties: skills || [],
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Error updating opportunity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Check if event exists and belongs to organization
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: id,
        organizationId: orgMember.organizationId,
      },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      )
    }

    // Delete event
    await prisma.event.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting opportunity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

