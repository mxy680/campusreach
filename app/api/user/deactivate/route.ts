import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/user/deactivate
// Deletes the current authenticated user. Related rows are removed via Prisma onDelete rules.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hard delete the user; relations with onDelete: Cascade will be removed automatically
    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/user/deactivate error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
