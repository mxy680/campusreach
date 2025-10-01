import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // Return only event-level categories for filtering
  const events = await prisma.event.findMany({ select: { categories: true } })
  const set = new Set<string>()
  for (const e of events) {
    for (const c of (e.categories as string[] | null) ?? []) {
      const v = String(c).trim()
      if (v) set.add(v)
    }
  }
  const data = Array.from(set).sort((a, b) => a.localeCompare(b))
  return NextResponse.json({ data })
}
