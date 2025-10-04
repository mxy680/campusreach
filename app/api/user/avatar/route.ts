import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    const endpoint = process.env.DO_SPACES_ENDPOINT
    const region = process.env.DO_SPACES_REGION
    const bucket = process.env.DO_SPACES_BUCKET
    const accessKeyId = process.env.DO_SPACES_KEY
    const secretAccessKey = process.env.DO_SPACES_SECRET

    if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: "Spaces not configured" }, { status: 500 })
    }

    // Normalize endpoint and style to avoid double-bucket host like `${bucket}.${bucket}.nyc3.digitaloceanspaces.com`
    const endpointUrl = new URL(endpoint)
    const hostHasBucket = endpointUrl.host.startsWith(`${bucket}.`)
    const s3 = new S3Client({
      region,
      endpoint, // keep as provided
      // If endpoint already includes the bucket subdomain, use path-style to avoid duplicating bucket in host
      forcePathStyle: hostHasBucket,
      credentials: { accessKeyId, secretAccessKey },
    })

    const arrayBuf = await file.arrayBuffer()
    const contentType = file.type || "image/jpeg"
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
      ? "gif"
      : "jpg"

    // Version the key to bust caches (CDN + browser)
    const ver = Date.now()
    const key = `users/${session.user.id}/avatar-${ver}.${ext}`

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(arrayBuf),
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        ACL: process.env.DO_SPACES_PUBLIC === "true" ? "public-read" : undefined,
      })
    )

    const endpointHost = endpointUrl.host
    const baseHost = endpointHost.startsWith(`${bucket}.`)
      ? endpointHost.slice((`${bucket}.`).length)
      : endpointHost
    const baseCdn = process.env.NEXT_PUBLIC_SPACES_CDN?.replace(/\/$/, "")
    const publicBase = baseCdn || `https://${bucket}.${baseHost}`
    // Per request, include the bucket as the first path segment as well
    const url = `${publicBase}/${bucket}/${key}`
    // Debug: helps diagnose misconfigured endpoints
    console.info("avatar upload -> url", { bucket, baseHost, url })

    // Optionally delete previous avatar if it lives in the same bucket
    try {
      const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } })
      const currentUrl = current?.image
      if (currentUrl && currentUrl.includes(`://${bucket}.`) ) {
        // Extract object key after the host; it may include an extra '/<bucket>/' path segment we added earlier
        const u = new URL(currentUrl)
        let objKey = u.pathname.replace(/^\//, "")
        // If path starts with 'bucketName/', strip it
        if (objKey.startsWith(`${bucket}/`)) objKey = objKey.slice(`${bucket}/`.length)
        if (objKey && objKey !== key) {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objKey }))
        }
      }
    } catch {}

    // Persist to user.image with the new, versioned URL
    await prisma.user.update({ where: { id: session.user.id }, data: { image: url } })

    return NextResponse.json({ url })
  } catch (e) {
    console.error("POST /api/user/avatar error", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
