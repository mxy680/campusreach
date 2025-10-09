import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (userId) {
      // Delete the user and cascade to related entities per schema
      await prisma.user.delete({ where: { id: userId } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("restricted signout delete failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
