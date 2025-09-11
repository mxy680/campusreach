import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ complete: false }, { status: 200 });
  }

  const v = await prisma.volunteer.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true, lastName: true },
  });

  const complete = !!(v && v.firstName && v.lastName);
  return NextResponse.json({ complete }, { status: 200 });
}
