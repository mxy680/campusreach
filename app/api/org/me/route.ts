import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Resolve organization: prefer membership; fallback to email heuristic
    let org = null as null | { id: string; name: string | null; email: string | null; avatarUrl: string | null; slug: string | null }
    const member = await prisma.organizationMember.findFirst({ where: { userId: user.id }, select: { organizationId: true } })
    if (member?.organizationId) {
      const o = await prisma.organization.findUnique({ where: { id: member.organizationId }, select: { id: true, name: true, email: true, avatarUrl: true, slug: true } })
      if (o) org = o
    }
    if (!org && user.email) {
      const o = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true, name: true, email: true, avatarUrl: true, slug: true } })
      if (o) org = o
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      },
      organization: org,
    });
  } catch (err) {
    console.error("GET /api/org/me error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
