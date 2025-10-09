import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected route prefixes
const PROFILE_PATH = "/auth/signup/user/profile";
const USER_SIGNUP_PREFIX = "/auth/signup/user";
const ORG_SIGNUP_PREFIX = "/auth/signup/organization";
const ORG_PROFILE_PATH = "/auth/signup/organization/profile";
const ORG_LINK_PATH = "/auth/link-org";
const ORG_START_PATH = "/auth/signup/organization/start";
const GENERIC_DASHBOARD_PATH = "/dashboard";
const RESTRICTED_PATH = "/restricted";
const USER_DASHBOARD_PATH = "/user/dashboard";
const ORG_DASHBOARD_PATH = "/org/dashboard";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always skip Next.js internals and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/logos") ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico|txt|xml|json)$/i.test(pathname) ||
    pathname.startsWith(RESTRICTED_PATH)
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

  // If not authenticated, redirect any non-auth page to signup
  const onAuthPages = pathname.startsWith("/auth");
  if (!isAuthed && !onAuthPages) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signup";
    url.search = `from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Determine key route flags (for authenticated flows below)
  const onProfile = pathname.startsWith(PROFILE_PATH);
  const onOrgProfile = pathname.startsWith(ORG_PROFILE_PATH);
  const onOrgLink = pathname.startsWith(ORG_LINK_PATH);
  const onOrgStart = pathname.startsWith(ORG_START_PATH);
  const onGenericDashboard = pathname.startsWith(GENERIC_DASHBOARD_PATH);
  const onUserDashboard = pathname.startsWith(USER_DASHBOARD_PATH);
  const onOrgDashboard = pathname.startsWith(ORG_DASHBOARD_PATH);

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

  // Enforce school email domain for volunteers, but do NOT block org-intent routes
  // Skip restriction when user is navigating org pages or org signup flow
  const onOrgPaths =
    pathname.startsWith("/org") || pathname.startsWith(ORG_SIGNUP_PREFIX) || onOrgProfile || onOrgStart || onOrgDashboard || onOrgLink;
  if (
    isAuthed &&
    !onOrgPaths &&
    !onAuthPages &&
    role === "VOLUNTEER" &&
    typeof token?.email === "string" &&
    !token.email.toLowerCase().endsWith("@case.edu") &&
    pathname !== RESTRICTED_PATH
  ) {
    return redirect(RESTRICTED_PATH);
  }

  // Generic dashboard should route to role-specific dashboard
  if (onGenericDashboard) {
    if (role === "ORGANIZATION") return redirect(ORG_DASHBOARD_PATH);
    // default volunteers
    return redirect(USER_DASHBOARD_PATH);
  }

  // Role-specific routing
  if (role === "VOLUNTEER") {
    // If a volunteer already completed their profile, redirect away from any user signup route
    // (profileComplete is set only on the final step now)
    if (profileComplete && pathname.startsWith(USER_SIGNUP_PREFIX)) {
      return redirect(USER_DASHBOARD_PATH);
    }
    // Volunteers should not access org dashboard
    if (onOrgDashboard) return redirect(USER_DASHBOARD_PATH);
    // Volunteers must complete profile before accessing their dashboard
    if (!profileComplete && onUserDashboard) return redirect(PROFILE_PATH);
    // Always allow volunteer signup flow pages regardless of completion state
  } else if (role === "ORGANIZATION") {
    // If an organization user is authenticated, skip user signup routes
    if (pathname.startsWith(USER_SIGNUP_PREFIX)) {
      return redirect(ORG_DASHBOARD_PATH);
    }
    // If org profile is already complete, redirect away from any org signup routes to dashboard
    if (profileComplete && pathname.startsWith(ORG_SIGNUP_PREFIX)) {
      return redirect(ORG_DASHBOARD_PATH);
    }
    // Orgs should not access user dashboard or profile page
    if (onUserDashboard || onProfile) return redirect(ORG_DASHBOARD_PATH);
  }

  // If authenticated and trying to access generic auth pages, push to respective dashboard
  // Do NOT redirect away from the organization profile step; allow it for both roles
  if (
    isAuthed &&
    // allow user signup flow pages (any under /auth/signup/user/*)
    !pathname.startsWith(USER_SIGNUP_PREFIX) &&
    // also allow org signup flow pages (any under /auth/signup/organization/*)
    !pathname.startsWith(ORG_SIGNUP_PREFIX) &&
    !onOrgProfile &&
    !onOrgStart &&
    // allow org invite link page to process linking
    !onOrgLink &&
    onAuthPages
  ) {
    return redirect(role === "ORGANIZATION" ? ORG_DASHBOARD_PATH : USER_DASHBOARD_PATH);
  }

  // Catch-all: if authenticated and visiting top-level or other non-dashboard, non-auth paths,
  // send them to their respective dashboard. This keeps users anchored in their area.
  if (
    isAuthed &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/org") &&
    !pathname.startsWith("/user") &&
    // Allow public volunteer profiles
    !pathname.startsWith("/v") &&
    pathname !== "/" // allow root to be redirected below as well
  ) {
    return redirect(role === "ORGANIZATION" ? ORG_DASHBOARD_PATH : USER_DASHBOARD_PATH);
  }

  // Redirect authenticated users from home page to their dashboard
  if (isAuthed && pathname === "/") {
    return redirect(role === "ORGANIZATION" ? ORG_DASHBOARD_PATH : USER_DASHBOARD_PATH);
  }

  return NextResponse.next();
}

// Configure which paths run through this middleware
export const config = {
  // Run on all paths except Next.js internals and static assets (Next.js recommended style)
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
