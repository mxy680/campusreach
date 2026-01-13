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
            contacts: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })

    if (!orgMember) {
      return NextResponse.json({ error: "Not an organization member" }, { status: 403 })
    }

    return NextResponse.json({
      organization: orgMember.organization,
    })
  } catch (error) {
    console.error("Error fetching organization profile:", error)
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
    const {
      name,
      type,
      description,
      categories,
      contactName,
      contactEmail,
      contactPhone,
      twitter,
      instagram,
      facebook,
      linkedin,
      contacts,
    } = body

    // Update organization
    await prisma.organization.update({
      where: { id: orgMember.organizationId },
      data: {
        name: name || null,
        type: type || null,
        description: description || null,
        categories: categories || [],
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        twitter: twitter || null,
        instagram: instagram || null,
        facebook: facebook || null,
        linkedin: linkedin || null,
      },
    })

    // Handle additional contacts
    if (Array.isArray(contacts)) {
      // Delete existing contacts
      await prisma.organizationContact.deleteMany({
        where: { organizationId: orgMember.organizationId },
      })

      // Create new contacts (only if they have at least a name)
      const contactsToCreate = contacts.filter(
        (c: { name?: string; email?: string; phone?: string; role?: string }) => c.name && c.name.trim() !== ""
      )

      if (contactsToCreate.length > 0) {
        await prisma.organizationContact.createMany({
          data: contactsToCreate.map((c: { name: string; email?: string; phone?: string; role?: string }) => ({
            organizationId: orgMember.organizationId,
            name: c.name,
            email: c.email || null,
            phone: c.phone || null,
            role: c.role || null,
          })),
        })
      }
    }

    // Fetch updated organization with contacts
    const updatedOrgWithContacts = await prisma.organization.findUnique({
      where: { id: orgMember.organizationId },
      include: {
        contacts: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json({
      organization: updatedOrgWithContacts,
    })
  } catch (error) {
    console.error("Error updating organization profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

