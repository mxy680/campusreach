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
    select: { role: true },
  });

  let profileComplete = false;
  if (user?.role === "VOLUNTEER") {
    const v = await prisma.volunteer.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true, lastName: true },
    });
    profileComplete = !!(v?.firstName && v?.lastName);
  }

  return NextResponse.json({ role: user?.role ?? null, profileComplete }, { status: 200 });
}
