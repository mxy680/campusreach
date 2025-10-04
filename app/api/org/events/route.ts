import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

type HttpError = Error & { status?: number }
function makeHttpError(message: string, status: number): HttpError {
  const err = new Error(message) as HttpError
  err.status = status
  return err
}

const ALLOWED_MIME_TYPES = new Set<string>([
  // images
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  // documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
])
const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB per file

async function uploadToSpaces(file: File, keyPrefix: string) {
  const endpoint = process.env.DO_SPACES_ENDPOINT
  const region = process.env.DO_SPACES_REGION
  const bucket = process.env.DO_SPACES_BUCKET
  const accessKeyId = process.env.DO_SPACES_KEY
  const secretAccessKey = process.env.DO_SPACES_SECRET
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Spaces not configured")
  }
  const endpointUrl = new URL(endpoint)
  const hostHasBucket = endpointUrl.host.startsWith(`${bucket}.`)
  const s3 = new S3Client({
    region,
    endpoint,
    // If endpoint already includes the bucket subdomain, use path-style to avoid duplicating bucket in host
    forcePathStyle: hostHasBucket,
    credentials: { accessKeyId, secretAccessKey },
  })

  // Validate type and size (with extension-based fallback when type is missing)
  const nameLower = file.name.toLowerCase()
  const ext = nameLower.slice(nameLower.lastIndexOf(".") + 1)
  const extToMime: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  }
  const contentType = file.type || extToMime[ext] || "application/octet-stream"
  const size: number | undefined = typeof (file as File).size === "number" ? (file as File).size : undefined
  // Debug log to help diagnose client/browser MIME issues
  console.info("events upload", {
    name: file.name,
    contentType,
    sizeMB: typeof size === "number" ? Number((size / (1024 * 1024)).toFixed(2)) : undefined,
  })
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw makeHttpError(`Unsupported type: ${contentType} (ext: .${ext || ""})`, 415)
  }
  if (typeof size === "number" && size > MAX_FILE_BYTES) {
    throw makeHttpError(`File too large: ${(size / (1024 * 1024)).toFixed(1)} MB (max 50 MB)`, 413)
  }
  const buf = Buffer.from(await file.arrayBuffer())
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const ver = Date.now()
  const key = `${keyPrefix}/${ver}_${safeName}`

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buf,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
    ACL: process.env.DO_SPACES_PUBLIC === "true" ? "public-read" : undefined,
  }))

  const endpointHost = endpointUrl.host
  const baseHost = endpointHost.startsWith(`${bucket}.`) ? endpointHost.slice((`${bucket}.`).length) : endpointHost
  const baseCdn = process.env.NEXT_PUBLIC_SPACES_CDN?.replace(/\/$/, "")
  const publicBase = baseCdn || `https://${bucket}.${baseHost}`
  // Keep bucket as first path segment (to match avatar URL convention you requested)
  const url = `${publicBase}/${bucket}/${key}`
  return url
}

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

    // Upload any files to Spaces and collect their URLs
    const attachments: string[] = [];
    const failures: Array<{ name: string; reason: string; status?: number }> = []
    const files = form.getAll("attachments");
    for (const f of files) {
      if (typeof f === "object" && "name" in f) {
        try {
          const url = await uploadToSpaces(f as File, `events/${organizationId ?? "no-org"}`)
          attachments.push(url)
        } catch (e: unknown) {
          const err = e as HttpError
          const name = (f as File).name
          const reason = err?.message || "Upload failed"
          const status = err?.status
          failures.push({ name, reason, status })
          console.warn("Failed to upload attachment", name, e)
        }
      }
    }
    if (failures.length > 0) {
      return NextResponse.json({ error: "Some files were rejected", failures }, { status: failures[0]?.status || 400 })
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
      attachments: string[];
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
        attachments: e.attachments ?? [],
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
    const failures: Array<{ name: string; reason: string; status?: number }> = []
    for (const f of files) {
      if (typeof f === "object" && "name" in f) {
        try {
          const url = await uploadToSpaces(f as File, `events/${organizationId ?? "no-org"}`)
          newAttachments.push(url)
        } catch (e: unknown) {
          const err = e as HttpError
          const name = (f as File).name
          const reason = err?.message || "Upload failed"
          const status = err?.status
          failures.push({ name, reason, status })
          console.warn("Failed to upload attachment", name, e)
        }
      }
    }
    if (failures.length > 0) {
      return NextResponse.json({ error: "Some files were rejected", failures }, { status: failures[0]?.status || 400 })
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
