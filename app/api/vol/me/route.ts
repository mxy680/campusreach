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
      user: {
        id: user.id,
        email: user.email,
        name: volunteer.name || user.user_metadata?.name || user.user_metadata?.full_name || null,
        image: volunteer.image || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        role: "volunteer",
      },
    })
  } catch (error) {
    console.error("Error fetching volunteer data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

