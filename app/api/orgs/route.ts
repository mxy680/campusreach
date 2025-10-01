import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return NextResponse.json({ data: orgs })
}
