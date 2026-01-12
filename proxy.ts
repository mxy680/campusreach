import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow access to all /auth routes
  if (pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // Protect all other routes - redirect to signin if not authenticated
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // Determine user type
  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  })

  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: user.id },
  })

  // Redirect root to appropriate dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    if (orgMember) {
      url.pathname = '/org'
    } else if (volunteer) {
      url.pathname = '/vol'
    } else {
      // User has no account type, redirect to signin
      url.pathname = '/auth/signin'
    }
    return NextResponse.redirect(url)
  }

  // Allow public profile routes - these are accessible to all authenticated users
  // Public volunteer profile: /vol/[id] where [id] is not a protected route
  const volPublicProfileMatch = pathname.match(/^\/vol\/([^\/]+)$/)
  if (volPublicProfileMatch) {
    const id = volPublicProfileMatch[1]
    // Check if it's not a protected route (like explore, profile, settings, messaging)
    const protectedVolRoutes = ['explore', 'profile', 'settings', 'messaging']
    if (!protectedVolRoutes.includes(id)) {
      // This is a public volunteer profile, allow access
      return supabaseResponse
    }
  }

  // Public organization profile: /org/[id] where [id] is not a protected route
  const orgPublicProfileMatch = pathname.match(/^\/org\/([^\/]+)$/)
  if (orgPublicProfileMatch) {
    const id = orgPublicProfileMatch[1]
    // Check if it's not a protected route (like opportunities, profile, settings, messaging, volunteers, team)
    const protectedOrgRoutes = ['opportunities', 'profile', 'settings', 'messaging', 'volunteers', 'team']
    if (!protectedOrgRoutes.includes(id)) {
      // This is a public organization profile, allow access
      return supabaseResponse
    }
  }

  // Protect organization routes - only orgs can access
  if (pathname.startsWith('/org')) {
    if (!orgMember) {
      const url = request.nextUrl.clone()
      // If volunteer, redirect to their dashboard, otherwise signin
      if (volunteer) {
        url.pathname = '/vol'
      } else {
        url.pathname = '/auth/signin'
      }
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Protect volunteer routes - only volunteers can access
  if (pathname.startsWith('/vol')) {
    if (!volunteer) {
      const url = request.nextUrl.clone()
      // If org, redirect to their dashboard, otherwise signin
      if (orgMember) {
        url.pathname = '/org'
      } else {
        url.pathname = '/auth/signin'
      }
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // For any other authenticated route, allow access
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

