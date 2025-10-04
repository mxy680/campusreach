import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, field, website } = (await req.json()) as { name?: string; field?: string; website?: string };
    if (!name || !field) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Disallow creating an org profile if this account is already a volunteer
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { volunteer: true },
    });
    if (me?.volunteer || me?.role === "VOLUNTEER") {
      return NextResponse.json({ error: "Email already used for a volunteer account" }, { status: 409 });
    }

    // Ensure the user has ORGANIZATION role
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "ORGANIZATION" },
    });

    // Load fresh user to get persisted image (provider/adapter may have saved it)
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true, id: true, email: true } })

    // Create an Organization record with a unique slug derived from user id
    const slug = crypto.createHash("sha256").update(session.user.id).digest("hex").slice(0, 16)

    // Attempt to mirror the user's avatar to DigitalOcean Spaces
    let uploadedLogoUrl: string | null = null
    const sourceImageUrl = dbUser?.image || session.user.image || null
    if (sourceImageUrl &&
        process.env.DO_SPACES_BUCKET &&
        process.env.DO_SPACES_ENDPOINT &&
        process.env.DO_SPACES_REGION &&
        process.env.DO_SPACES_KEY &&
        process.env.DO_SPACES_SECRET) {
      try {
        const s3 = new S3Client({
          region: process.env.DO_SPACES_REGION,
          endpoint: process.env.DO_SPACES_ENDPOINT,
          forcePathStyle: false,
          credentials: {
            accessKeyId: process.env.DO_SPACES_KEY!,
            secretAccessKey: process.env.DO_SPACES_SECRET!,
          },
        })

        const res = await fetch(sourceImageUrl, { redirect: "follow" })
        if (res.ok) {
          const arr = await res.arrayBuffer()
          // derive content type or default
          const contentType = res.headers.get("content-type") || "image/jpeg"
          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg"
          const key = `orgs/${slug}/logo.${ext}`

          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.DO_SPACES_BUCKET,
              Key: key,
              Body: Buffer.from(arr),
              ContentType: contentType,
              CacheControl: "public, max-age=31536000, immutable",
              ACL: process.env.DO_SPACES_PUBLIC === "true" ? "public-read" : undefined,
            })
          )

          const endpointHost = new URL(process.env.DO_SPACES_ENDPOINT!).host
          const baseCdn = process.env.NEXT_PUBLIC_SPACES_CDN?.replace(/\/$/, "")
          uploadedLogoUrl = baseCdn
            ? `${baseCdn}/${key}`
            : `https://${process.env.DO_SPACES_BUCKET}.${endpointHost}/${key}`
        } else {
          console.warn("Avatar fetch failed", { status: res.status, url: sourceImageUrl })
        }
      } catch (e) {
        console.warn("Failed to mirror avatar to Spaces; continuing without logo", e)
      }
    }

    await prisma.organization.create({
      data: {
        name,
        industry: field,
        email: session.user.email ?? null,
        website: website || null,
        slug,
        logoUrl: uploadedLogoUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/signup/organization/profile error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
