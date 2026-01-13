import { createServerClient } from "@supabase/ssr"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Map from URL school identifier to full school name
const SCHOOL_NAME_MAP: Record<string, string> = {
  "cwru": "Case Western Reserve University",
  "case-western": "Case Western Reserve University",
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const signupType = requestUrl.searchParams.get("type")
  const schoolParam = requestUrl.searchParams.get("school")
  const organizationId = requestUrl.searchParams.get("organizationId")

  const cookieStore = await cookies()

  // Track cookies to set on redirect response
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            cookiesToSet.push({ name, value, options })
          })
        },
      },
    }
  )

  // Helper to create redirect with cookies
  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url)
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    })
    return response
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error("Exchange error:", exchangeError)
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("Callback - user:", user?.email, "authError:", authError?.message, "cookies:", cookiesToSet.length)

  if (authError || !user) {
    return redirectWithCookies(new URL("/auth/signin", requestUrl.origin))
  }

  // Handle sign in (no type parameter means existing user signing in)
  if (!signupType) {
    // Check if user exists as volunteer or organization member
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
    })

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
    })

    if (volunteer) {
      // User is a volunteer, redirect to volunteer dashboard
      return redirectWithCookies(new URL("/vol", requestUrl.origin))
    } else if (orgMember) {
      // User is an organization member, update logoUrl if missing
      const logoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      if (!orgMember.logoUrl && logoUrl) {
        await prisma.organizationMember.update({
          where: { id: orgMember.id },
          data: { logoUrl: logoUrl },
        })
      }
      // Redirect to org dashboard
      return redirectWithCookies(new URL("/org", requestUrl.origin))
    } else {
      // User doesn't exist, redirect to signin with error
      return redirectWithCookies(
        new URL("/auth/signin?error=no_account", requestUrl.origin)
      )
    }
  }

  // Handle organization signup
  if (signupType === "organization") {
    // Check if user is already associated with a volunteer account
    const existingVolunteer = await prisma.volunteer.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email! },
        ],
      },
    })

    if (existingVolunteer) {
      // Email/userId already associated with a volunteer account
      return redirectWithCookies(
        new URL("/auth/signup/volunteer?error=email_exists", requestUrl.origin)
      )
    }

    // Check if user is already a member of an organization
    const existingMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
    })

    if (existingMember) {
      // User already has an organization account, update logoUrl if missing
      const logoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      if (!existingMember.logoUrl && logoUrl) {
        await prisma.organizationMember.update({
          where: { id: existingMember.id },
          data: { logoUrl: logoUrl },
        })
      }
      // Redirect to org dashboard
      return redirectWithCookies(new URL("/org", requestUrl.origin))
    }

    // Create new organization and link user as member
    // Extract name and logoUrl from user metadata
    const name = user.user_metadata?.name || user.user_metadata?.full_name || null
    const logoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    
    console.log("Creating organization with member:", {
      email: user.email,
      userId: user.id,
      name,
      logoUrl,
      userMetadata: user.user_metadata,
    })
    
    try {
      // Use a transaction to ensure both organization and member are created
      const result = await prisma.$transaction(async (tx) => {
        // Create organization first
        const newOrg = await tx.organization.create({
          data: {
            email: user.email!,
          },
        })
        
        console.log("Organization created:", newOrg.id)

        // Create member separately to ensure logoUrl is saved
        const newMember = await tx.organizationMember.create({
          data: {
            organizationId: newOrg.id,
            userId: user.id,
            email: user.email!,
            name: name,
            logoUrl: logoUrl,
          },
        })
        
        console.log("Member created with logoUrl:", { memberId: newMember.id, logoUrl: newMember.logoUrl })
        
        return { org: newOrg, member: newMember }
      })
      
      console.log("Transaction completed:", result)
    } catch (error) {
      console.error("Error creating organization and member:", error)
      // If organization was created but member wasn't, try to create member separately
      const existingOrg = await prisma.organization.findFirst({
        where: { email: user.email! },
      })
      if (existingOrg) {
        const existingMember = await prisma.organizationMember.findFirst({
          where: { userId: user.id, organizationId: existingOrg.id },
        })
        if (!existingMember) {
          await prisma.organizationMember.create({
            data: {
              organizationId: existingOrg.id,
              userId: user.id,
              email: user.email!,
              name: name,
              logoUrl: logoUrl,
            },
          })
        }
      } else {
        throw error
      }
    }

    return redirectWithCookies(new URL("/org", requestUrl.origin))
  }

  // Handle organization join request
  if (signupType === "org-join") {
    if (!organizationId) {
      return redirectWithCookies(
        new URL("/auth/signup/organization?error=missing_organization", requestUrl.origin)
      )
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return redirectWithCookies(
        new URL("/auth/signup/organization?error=organization_not_found", requestUrl.origin)
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
      // User is already a member, redirect to org dashboard
      return redirectWithCookies(new URL("/org", requestUrl.origin))
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
      // Join request already exists, redirect with success message
      return redirectWithCookies(
        new URL("/auth/signup/organization?success=join_request_sent", requestUrl.origin)
      )
    }

    // Create join request
    try {
      await prisma.organizationJoinRequest.create({
        data: {
          organizationId: organizationId,
          userId: user.id,
          email: user.email || null,
          status: "PENDING",
        },
      })

      // Redirect with success message
      return redirectWithCookies(
        new URL("/auth/signup/organization?success=join_request_sent", requestUrl.origin)
      )
    } catch (error) {
      console.error("Error creating join request:", error)
      return redirectWithCookies(
        new URL("/auth/signup/organization?error=join_request_failed", requestUrl.origin)
      )
    }
  }

  // Handle volunteer signup (default)
  // Check if user is already associated with an organization account
  const existingOrgMember = await prisma.organizationMember.findFirst({
    where: { 
      OR: [
        { userId: user.id },
        { email: user.email! },
      ],
    },
  })

  if (existingOrgMember) {
    // Email/userId already associated with an organization account
    return redirectWithCookies(
      new URL("/auth/signup/organization?error=email_exists", requestUrl.origin)
    )
  }

  // Validate email domain for volunteer signup
  const allowedDomains = ["@case.edu"]
  const userEmail = user.email
  const isValidDomain = userEmail ? allowedDomains.some(domain => userEmail.endsWith(domain)) : false

  if (!isValidDomain) {
    // Email domain not allowed for volunteer signup
    return redirectWithCookies(
      new URL("/auth/signup/volunteer?error=invalid_domain", requestUrl.origin)
    )
  }

  // Check if volunteer already exists
  let volunteer = await prisma.volunteer.findUnique({
    where: { userId: user.id },
  })

  if (!volunteer) {
    // Check if email is already used by another volunteer (by email, not userId)
    const existingVolunteerByEmail = await prisma.volunteer.findUnique({
      where: { email: user.email! },
    })

    if (existingVolunteerByEmail) {
      // Email already associated with a volunteer account
      return redirectWithCookies(
        new URL("/auth/signup/volunteer?error=email_exists", requestUrl.origin)
      )
    }

    // Extract first and last name from user metadata or email
    const name = user.user_metadata?.name || user.user_metadata?.full_name || ""
    const nameParts = name.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Get school from parameter or default based on email domain
    let school = "Case Western Reserve University" // Default fallback
    if (schoolParam) {
      school = SCHOOL_NAME_MAP[schoolParam] || schoolParam
    }
    
    volunteer = await prisma.volunteer.create({
      data: {
        userId: user.id,
        email: user.email!,
        firstName: firstName || "User",
        lastName: lastName || "",
        name: name || user.email?.split("@")[0] || "User",
        image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        school: school,
      },
    })
  } else {
    // Update email if it changed, but validate domain first
    if (volunteer.email !== user.email) {
      // Validate email domain before updating
      const allowedDomains = ["@case.edu"]
      const userEmail = user.email
      const isValidDomain = userEmail ? allowedDomains.some(domain => userEmail.endsWith(domain)) : false

      if (!isValidDomain) {
        // Email domain not allowed for volunteer account
        return redirectWithCookies(
          new URL("/auth/signup/volunteer?error=invalid_domain", requestUrl.origin)
        )
      }

      await prisma.volunteer.update({
        where: { id: volunteer.id },
        data: { email: user.email! },
      })
    }
  }

  return redirectWithCookies(new URL("/vol", requestUrl.origin))
}

