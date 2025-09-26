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

    // Find org via user email (same strategy as /api/org/me)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    let organizationId: string | null = null;
    if (user?.email) {
      const org = await prisma.organization.findFirst({ where: { email: user.email } });
      organizationId = org?.id ?? null;
    }

    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const shortDescription = String(form.get("shortDescription") || "").trim() || null;
    const startsAtStr = String(form.get("startsAt") || "");
    const volunteersNeeded = Number(form.get("volunteersNeeded") || 0);
    const specialtiesJson = String(form.get("specialties") || "[]");

    if (!title || !startsAtStr || !volunteersNeeded) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let startsAt: Date;
    try {
      startsAt = new Date(startsAtStr);
      if (isNaN(startsAt.getTime())) throw new Error("invalid date");
    } catch {
      return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
    }

    let specialties: string[] = [];
    try {
      const parsed = JSON.parse(specialtiesJson);
      if (Array.isArray(parsed)) specialties = parsed.map((s) => String(s));
    } catch {
      // ignore, keep default []
    }

    // Files: in this basic implementation we only store file names as placeholders.
    // You can replace this with an upload to S3/R2 and store the resulting URLs.
    const attachments: string[] = [];
    const files = form.getAll("attachments");
    for (const f of files) {
      // f is a File per standard Request.formData
      if (typeof f === "object" && "name" in f) attachments.push((f as File).name);
    }

    const created = await prisma.event.create({
      data: {
        title,
        shortDescription,
        startsAt,
        volunteersNeeded,
        specialties,
        attachments,
        organization: organizationId ? { connect: { id: organizationId } } : undefined,
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/org/events error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
