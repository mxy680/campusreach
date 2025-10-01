"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { Opportunity } from "./types"
import { OpportunityCard } from "./OpportunityCard"

export function ResultsGrid({ items, loading }: { items: Opportunity[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-3"><CardContent className="p-6 text-center text-sm text-muted-foreground">Loading opportunities…</CardContent></Card>
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-3"><CardContent className="p-6 text-center text-sm text-muted-foreground">No opportunities match your filters.</CardContent></Card>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((o) => (
        <OpportunityCard key={o.id} o={o} />
      ))}
    </div>
  )
}
