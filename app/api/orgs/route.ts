// Keeping this file as-is to avoid breaking other uses. A new secured route will be added at /api/orgs/mine.
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return NextResponse.json({ data: orgs })
}
