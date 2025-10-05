import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function toCSV(rows: Array<Record<string, unknown>>, headers: string[]) {
  const esc = (v: unknown) => {
    if (v == null) return ""
    const s = String(v)
    if (s.includes(",") || s.includes("\n") || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const out = [headers.join(",")]
  for (const r of rows) out.push(headers.map((h) => esc(r[h])).join(","))
  return out.join("\n")
}

// GET /api/org/export?type=signups|volunteers|messages|account
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") as "signups" | "volunteers" | "messages" | "account" | null
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 })

    // Resolve org by current user's email (same as org/settings), then ensure requester is a member
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, id: true } })
    if (!user?.email) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
    if (!org?.id) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    const member = await prisma.organizationMember.findFirst({ where: { organizationId: org.id, userId: session.user.id } })
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let csv = ""
    let filename = "export.csv"

    if (type === "signups") {
      const rows: Array<{
        id: string
        status: string
        createdAt: Date
        event: { title: string | null; startsAt: Date | null; endsAt: Date | null } | null
        volunteer: { user: { email: string | null; name: string | null } | null } | null
      }> = await prisma.eventSignup.findMany({
        where: { event: { organizationId: org.id } },
        include: { event: { select: { title: true, startsAt: true, endsAt: true } }, volunteer: { select: { user: { select: { email: true, name: true } } } } },
        orderBy: { createdAt: "asc" },
      })
      const flat = rows.map((r: {
        id: string
        status: string
        createdAt: Date
        event: { title: string | null; startsAt: Date | null; endsAt: Date | null } | null
        volunteer: { user: { email: string | null; name: string | null } | null } | null
      }) => ({
        signupId: r.id,
        eventTitle: r.event?.title ?? "",
        startsAt: r.event?.startsAt?.toISOString() ?? "",
        endsAt: r.event?.endsAt?.toISOString() ?? "",
        volunteerName: r.volunteer?.user?.name ?? "",
        volunteerEmail: r.volunteer?.user?.email ?? "",
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))
      csv = toCSV(flat, ["signupId", "eventTitle", "startsAt", "endsAt", "volunteerName", "volunteerEmail", "status", "createdAt"])
      filename = `signups-${org.id}.csv`
    } else if (type === "volunteers") {
      const rows: Array<{
        id: string
        major: string | null
        school: string | null
        phone: string | null
        createdAt: Date
        user: { email: string | null; name: string | null } | null
      }> = await prisma.volunteer.findMany({
        where: { signups: { some: { event: { organizationId: org.id } } } },
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      })
      const flat = rows.map((v: {
        id: string
        major: string | null
        school: string | null
        phone: string | null
        createdAt: Date
        user: { email: string | null; name: string | null } | null
      }) => ({
        volunteerId: v.id,
        name: v.user?.name ?? "",
        email: v.user?.email ?? "",
        major: v.major ?? "",
        school: v.school ?? "",
        phone: v.phone ?? "",
        createdAt: v.createdAt.toISOString(),
      }))
      csv = toCSV(flat, ["volunteerId", "name", "email", "major", "school", "phone", "createdAt"])
      filename = `volunteers-${org.id}.csv`
    } else if (type === "messages") {
      const rows: Array<{
        id: string
        createdAt: Date
        body: string
        event: { title: string | null } | null
        user: { name: string | null; email: string | null } | null
        groupChat: { id: string } | null
      }> = await prisma.chatMessage.findMany({
        where: { event: { organizationId: org.id } },
        include: {
          event: { select: { title: true } },
          user: { select: { name: true, email: true } },
          groupChat: { select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      })
      const flat: Array<{
        messageId: string
        eventTitle: string
        authorName: string
        authorEmail: string
        createdAt: string
        body: string
      }> = rows.map((m: {
        id: string
        createdAt: Date
        body: string
        event: { title: string | null } | null
        user: { name: string | null; email: string | null } | null
      }) => ({
        messageId: m.id,
        eventTitle: m.event?.title ?? "",
        authorName: m.user?.name ?? "",
        authorEmail: m.user?.email ?? "",
        createdAt: m.createdAt.toISOString(),
        body: m.body,
      }))
      csv = toCSV(flat, ["messageId", "eventTitle", "authorName", "authorEmail", "createdAt", "body"])
      filename = `messages-${org.id}.csv`
    } else if (type === "account") {
      const orgInfo = await prisma.organization.findUnique({
        where: { id: org.id },
        select: {
          id: true,
          name: true,
          email: true,
          contactEmail: true,
          timezone: true,
          locale: true,
          defaultEventLocationTemplate: true,
          defaultTimeCommitmentHours: true,
          defaultVolunteersNeeded: true,
          categories: true,
          website: true,
          twitter: true,
          instagram: true,
          facebook: true,
          linkedin: true,
          description: true,
          mission: true,
          contactName: true,
          contactPhone: true,
          logoUrl: true,
        },
      })
      const body = JSON.stringify(orgInfo, null, 2)
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename=organization-${org.id}.json`,
        },
      })
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
