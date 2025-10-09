import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const callbackUrl = url.searchParams.get("callbackUrl") || "/auth/signin";

  // POST to NextAuth signout endpoint while forwarding cookies
  const signoutUrl = new URL("/api/auth/signout", url.origin);
  await fetch(signoutUrl.toString(), {
    method: "POST",
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  const redirectUrl = new URL(callbackUrl, url.origin);
  return NextResponse.redirect(redirectUrl);
}
