import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing 'email' query param" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { name: true } });
    if (!user || !user.name) {
      return NextResponse.json({ message: "Name not found" }, { status: 404 });
    }
    return NextResponse.json({ name: user.name }, { status: 200 });
  } catch (e) {
    console.error("GET /api/users/name error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
