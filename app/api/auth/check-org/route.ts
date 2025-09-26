import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").toLowerCase();
  if (!email) return NextResponse.json({ exists: false }, { status: 200 });

  const user = await prisma.user.findUnique({ where: { email } });
  const exists = !!user && user.role === "ORGANIZATION";
  return NextResponse.json({ exists }, { status: 200 });
}
