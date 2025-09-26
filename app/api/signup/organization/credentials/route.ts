import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const hash = await bcrypt.hash(password, 10);

    // Try to find existing user by email
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { volunteer: true } });
    if (existing) {
      // If user already has a volunteer profile or explicit volunteer role, block
      if (existing.volunteer || existing.role === "VOLUNTEER") {
        return NextResponse.json({ error: "Email already used for a volunteer account" }, { status: 409 });
      }
      // Otherwise, allow setting/updating password and keep/ensure ORGANIZATION role
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: "ORGANIZATION",
          hashedPassword: hash,
        },
      });
    } else {
      // Create a new user with ORGANIZATION role
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          role: "ORGANIZATION",
          hashedPassword: hash,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/signup/organization/credentials error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
