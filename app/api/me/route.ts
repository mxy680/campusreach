import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ role: null, profileComplete: false }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, profileComplete: true },
  });

  return NextResponse.json({ role: user?.role ?? null, profileComplete: !!user?.profileComplete }, { status: 200 });
}
