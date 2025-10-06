import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ complete: false }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { profileComplete: true },
  });

  return NextResponse.json({ complete: !!user?.profileComplete }, { status: 200 });
}
