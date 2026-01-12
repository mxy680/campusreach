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

    // Get volunteer record
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
    })

    if (!volunteer) {
      return NextResponse.json({ error: "Not a volunteer" }, { status: 403 })
    }

    return NextResponse.json({
      volunteer,
    })
  } catch (error) {
    console.error("Error fetching volunteer profile:", error)
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

    // Get volunteer record
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
    })

    if (!volunteer) {
      return NextResponse.json({ error: "Not a volunteer" }, { status: 403 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      name,
      school,
      major,
      graduationYear,
      phone,
      transportMode,
      radiusMiles,
      image,
    } = body

    // Convert graduationYear to graduationDate if provided
    let graduationDate: Date | null = null
    if (graduationYear) {
      // Assume graduation is in May/June, so set to May 1st of that year
      graduationDate = new Date(parseInt(graduationYear), 4, 1) // Month is 0-indexed, so 4 = May
    }

    // Update volunteer
    const updatedVolunteer = await prisma.volunteer.update({
      where: { id: volunteer.id },
      data: {
        firstName: firstName !== undefined ? firstName : volunteer.firstName,
        lastName: lastName !== undefined ? lastName : volunteer.lastName,
        name: name !== undefined ? name : volunteer.name,
        school: school !== undefined ? school : null,
        major: major !== undefined ? major : null,
        graduationDate: graduationDate || volunteer.graduationDate,
        phone: phone !== undefined ? phone : null,
        transportMode: transportMode !== undefined ? transportMode : null,
        radiusMiles: radiusMiles !== undefined ? radiusMiles : null,
        image: image !== undefined ? image : volunteer.image,
      },
    })

    return NextResponse.json({
      volunteer: updatedVolunteer,
    })
  } catch (error) {
    console.error("Error updating volunteer profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

