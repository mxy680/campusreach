import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, field, website } = (await req.json()) as { name?: string; field?: string; website?: string };
    if (!name || !field) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Ensure the user has ORGANIZATION role
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "ORGANIZATION" },
    });

    // Create an Organization record (no user relation yet in schema)
    await prisma.organization.create({
      data: {
        name,
        industry: field,
        email: session.user.email ?? null,
        website: website || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/signup/organization/profile error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
