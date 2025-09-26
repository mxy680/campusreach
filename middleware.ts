import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected route prefixes
const PROFILE_PATH = "/auth/signup/user/profile";
const ORG_PROFILE_PATH = "/auth/signup/organization/profile";
const ORG_START_PATH = "/auth/signup/organization/start";
const GENERIC_DASHBOARD_PATH = "/dashboard";
const USER_DASHBOARD_PATH = "/user/dashboard";
const ORG_DASHBOARD_PATH = "/org/dashboard";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always skip Next.js internals and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Read NextAuth token (JWT strategy)
  const token = await getToken({ req });
  const isAuthed = !!token?.sub;

  // Helper to build redirects safely
  const redirect = (to: string) => {
    const url = req.nextUrl.clone();
    url.pathname = to;
    url.search = ""; // avoid loops with same URL but different query
    if (url.pathname === pathname) return NextResponse.next();
    return NextResponse.redirect(url);
  };

  // If not authenticated, allow public pages; optionally gate private ones here
  // Determine key route flags
  const onProfile = pathname.startsWith(PROFILE_PATH);
  const onOrgProfile = pathname.startsWith(ORG_PROFILE_PATH);
  const onOrgStart = pathname.startsWith(ORG_START_PATH);
  const onGenericDashboard = pathname.startsWith(GENERIC_DASHBOARD_PATH);
  const onUserDashboard = pathname.startsWith(USER_DASHBOARD_PATH);
  const onOrgDashboard = pathname.startsWith(ORG_DASHBOARD_PATH);
  const onAnyDashboard = onGenericDashboard || onUserDashboard || onOrgDashboard;
  const onAuthPages = pathname === "/auth/signin" || pathname === "/auth/signup" || pathname.startsWith("/auth/signup/");

  // If unauthenticated and accessing protected routes, send to sign-in with return URL
  if (!isAuthed && (onAnyDashboard || onProfile)) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.search = `from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // From here on, user is authenticated. Apply completion gating and auth-page redirection
  if (!isAuthed) {
    return NextResponse.next();
  }

  // Fetch role and profile completion in one call
  let role: "VOLUNTEER" | "ORGANIZATION" | null = null;
  let profileComplete = false;
  try {
    const apiUrl = new URL("/api/me", req.nextUrl.origin);
    const res = await fetch(apiUrl.toString(), {
      headers: { cookie: req.headers.get("cookie") || "" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { role: "VOLUNTEER" | "ORGANIZATION" | null; profileComplete: boolean };
      role = data.role;
      profileComplete = data.profileComplete;
    }
  } catch {
    // leave defaults
  }

  // Generic dashboard should route to role-specific dashboard
  if (onGenericDashboard) {
    if (role === "ORGANIZATION") return redirect(ORG_DASHBOARD_PATH);
    // default volunteers
    return redirect(USER_DASHBOARD_PATH);
  }

  // Role-specific routing
  if (role === "VOLUNTEER") {
    // Volunteers should not access org dashboard
    if (onOrgDashboard) return redirect(USER_DASHBOARD_PATH);
    // Volunteers must complete profile before accessing their dashboard
    if (!profileComplete && onUserDashboard) return redirect(PROFILE_PATH);
    // If profile complete and trying to access profile page, push to their dashboard
    if (profileComplete && onProfile) return redirect(USER_DASHBOARD_PATH);
  } else if (role === "ORGANIZATION") {
    // Orgs should not access user dashboard or profile page
    if (onUserDashboard || onProfile) return redirect(ORG_DASHBOARD_PATH);
  }

  // If authenticated and trying to access generic auth pages, push to respective dashboard
  // Do NOT redirect away from the organization profile step; allow it for both roles
  if (isAuthed && !onProfile && !onOrgProfile && !onOrgStart && onAuthPages) {
    return redirect(role === "ORGANIZATION" ? ORG_DASHBOARD_PATH : USER_DASHBOARD_PATH);
  }

  return NextResponse.next();
}

// Configure which paths run through this middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/user/dashboard/:path*",
    "/org/dashboard/:path*",
    "/auth/signup/user/profile",
    "/auth/signin",
    "/auth/signup",
    "/auth/signup/:path*",
  ],
};
