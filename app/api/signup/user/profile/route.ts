import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, pronouns, major, graduationDate } = (await req.json()) as {
      firstName: string;
      lastName: string;
      pronouns?: string;
      major?: string;
      graduationDate?: string; // ISO date from input type="date"
      // password?: string; // collected but not used for Google-based accounts
    };

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const gradAt = graduationDate ? new Date(graduationDate) : null;

    await prisma.volunteer.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        firstName,
        lastName,
        pronouns: pronouns || null,
        major: major || null,
        graduationDate: gradAt,
      },
      update: {
        firstName,
        lastName,
        pronouns: pronouns || null,
        major: major || null,
        graduationDate: gradAt,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/signup/user/profile error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
