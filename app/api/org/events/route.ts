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
    const notes = String(form.get("notes") || "").trim() || null;
    const timeCommitmentHoursRaw = String(form.get("timeCommitmentHours") || "").trim();
    const timeCommitmentHours = timeCommitmentHoursRaw ? Number(timeCommitmentHoursRaw) : null;

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

    // Try to extract a Location: ... line from the shortDescription (client composes this)
    const locMatch = /Location:\s*([^\n]+)/i.exec(shortDescription ?? "")
    const location = locMatch?.[1]?.trim()

    const created = await prisma.event.create({
      data: {
        title,
        shortDescription,
        startsAt,
        volunteersNeeded,
        notes,
        timeCommitmentHours,
        specialties,
        attachments,
        ...(location ? { location } : {}),
        organization: organizationId ? { connect: { id: organizationId } } : undefined,
      },
    });

    // Ensure GroupChat exists and seed a system welcome message
    try {
      const gc = await prisma.groupChat.create({ data: { eventId: created.id } })
      await prisma.chatMessage.create({
        data: {
          groupChat: { connect: { id: gc.id } },
          authorType: "SYSTEM",
          kind: "ANNOUNCEMENT",
          body: `Welcome to the group chat for "${title}"!`,
        },
      })
    } catch (e) {
      console.warn("Failed to seed initial group chat/message", e)
    }

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/org/events error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Derive org by user email (same heuristic used in POST)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    let organizationId: string | null = null;
    if (user?.email) {
      const org = await prisma.organization.findFirst({ where: { email: user.email } });
      organizationId = org?.id ?? null;
    }

    const where = organizationId ? { organizationId } : {};
    type EventRow = {
      id: string;
      title: string;
      shortDescription: string | null;
      startsAt: Date;
      volunteersNeeded: number;
      notes: string | null;
      timeCommitmentHours: number | null;
      specialties: string[];
      _count: { signups: number };
    }
    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { signups: true } } },
    }) as unknown as EventRow[];

    const rows = events.map((e) => {
      const shortDescription = (e.shortDescription ?? "").replace(/Location:\s*[^\n]+/i, "").trim() || null
      return {
        id: e.id,
        title: e.title,
        shortDescription,
        startsAt: e.startsAt.toISOString(),
        volunteersNeeded: e.volunteersNeeded,
        notes: e.notes ?? null,
        timeCommitmentHours: e.timeCommitmentHours ?? null,
        specialties: e.specialties ?? [],
        signedUpCount: e._count.signups,
        completedCount: undefined,
        hoursLogged: undefined,
      }
    })

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/org/events error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Resolve org by email (same heuristic as POST/GET)
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    let organizationId: string | null = null
    if (user?.email) {
      const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
      organizationId = org?.id ?? null
    }

    const form = await req.formData()
    const id = String(form.get("id") || "").trim()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const title = String(form.get("title") || "").trim()
    const shortDescription = String(form.get("shortDescription") || "").trim() || null
    const startsAtStr = String(form.get("startsAt") || "")
    const volunteersNeeded = Number(form.get("volunteersNeeded") || 0)
    const specialtiesJson = String(form.get("specialties") || "[]")
    const notes = String(form.get("notes") || "").trim() || null
    const timeCommitmentHoursRaw = String(form.get("timeCommitmentHours") || "").trim()
    const timeCommitmentHours = timeCommitmentHoursRaw ? Number(timeCommitmentHoursRaw) : null

    if (!title || !startsAtStr || !volunteersNeeded) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let startsAt: Date
    try {
      startsAt = new Date(startsAtStr)
      if (isNaN(startsAt.getTime())) throw new Error("invalid date")
    } catch {
      return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 })
    }

    let specialties: string[] = []
    try {
      const parsed = JSON.parse(specialtiesJson)
      if (Array.isArray(parsed)) specialties = parsed.map((s) => String(s))
    } catch {
      // keep []
    }

    // Gather file names; only replace attachments if any provided
    const files = form.getAll("attachments")
    const newAttachments: string[] = []
    for (const f of files) {
      if (typeof f === "object" && "name" in f) newAttachments.push((f as File).name)
    }

    // Ensure the event belongs to this org (if org exists)
    const existing = await prisma.event.findUnique({ where: { id }, select: { organizationId: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (organizationId && existing.organizationId && existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Extract location from composed description if present
    const locMatch = /Location:\s*([^\n]+)/i.exec(shortDescription ?? "")
    const location = locMatch?.[1]?.trim()

    await prisma.event.update({
      where: { id },
      data: {
        title,
        shortDescription,
        startsAt,
        volunteersNeeded,
        notes,
        timeCommitmentHours,
        specialties,
        ...(location ? { location } : {}),
        ...(newAttachments.length > 0 ? { attachments: newAttachments } : {}),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PUT /api/org/events error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    // Verify event belongs to the org associated with this user (email heuristic)
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    let orgId: string | null = null
    if (user?.email) {
      const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
      orgId = org?.id ?? null
    }

    const ev = await prisma.event.findUnique({ where: { id }, select: { organizationId: true } })
    if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (orgId && ev.organizationId && ev.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/org/events error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
