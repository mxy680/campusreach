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

    // Find organization by the same email as the user
    let orgName: string | null = null;
    if (user.email) {
      const org = await prisma.organization.findFirst({ where: { email: user.email } });
      orgName = org?.name ?? null;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      },
      organization: {
        name: orgName,
      },
    });
  } catch (err) {
    console.error("GET /api/org/me error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
