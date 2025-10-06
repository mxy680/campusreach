import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  // Check existing
  const existing = await prisma.volunteer.findUnique({ where: { userId }, select: { id: true, slug: true } });
  if (!existing) return NextResponse.json({ error: "Volunteer profile not found" }, { status: 404 });

  if (existing.slug) {
    return NextResponse.json({ ok: true, slug: existing.slug });
  }

  const stableSlug = crypto.createHash("sha256").update(userId).digest("hex").slice(0, 16);
  const updated = await prisma.volunteer.update({ where: { id: existing.id }, data: { slug: stableSlug }, select: { slug: true } });
  return NextResponse.json({ ok: true, slug: updated.slug });
}
