import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // Return unique specialties for filtering (categories removed from schema)
  const events = await prisma.event.findMany({ select: { specialties: true } })
  const set = new Set<string>()
  for (const e of events) {
    for (const c of (e.specialties as string[] | null) ?? []) {
      const v = String(c).trim()
      if (v) set.add(v)
    }
  }
  const data = Array.from(set).sort((a, b) => a.localeCompare(b))
  return NextResponse.json({ data })
}
