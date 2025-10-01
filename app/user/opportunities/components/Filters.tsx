"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"

type Props = {
  query: string
  setQuery: (v: string) => void
  timeCommit: string
  setTimeCommit: (v: string) => void
  from: string
  setFrom: (v: string) => void
  to: string
  setTo: (v: string) => void
  selectedSpecs: string[]
  setSelectedSpecs: React.Dispatch<React.SetStateAction<string[]>>
  categoryOptions: string[]
}

export function Filters({ query, setQuery, timeCommit, setTimeCommit, from, setFrom, to, setTo, selectedSpecs, setSelectedSpecs, categoryOptions }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-6 md:items-end">
      <div className="md:col-span-2">
        <Label htmlFor="q" className="text-xs">Search</Label>
        <Input id="q" placeholder="Search by title, org, or keyword" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="commit" className="text-xs">Time commitment</Label>
        <select id="commit" value={timeCommit} onChange={(e) => setTimeCommit(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
          <option value="any">Any</option>
          <option value="short">Short (&lt;=2h)</option>
          <option value="halfday">Half day (&lt;=5h)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="from" className="text-xs">From</Label>
        <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="to" className="text-xs">To</Label>
        <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Specialties</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="h-9 w-full rounded-md border border-input bg-background px-2 text-left text-sm flex items-center justify-between">
              <span className="truncate">
                {selectedSpecs.length === 0 ? "Any" : selectedSpecs.join(", ")}
              </span>
              <svg className="size-4 opacity-60" viewBox="0 0 20 20"><path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-1">
            <DropdownMenuCheckboxItem
              checked={selectedSpecs.length === 0}
              onCheckedChange={(v: boolean) => {
                if (v) setSelectedSpecs([])
              }}
            >Any</DropdownMenuCheckboxItem>
            {categoryOptions.map((c) => {
              const checked = selectedSpecs.includes(c)
              return (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={checked}
                  onCheckedChange={(v: boolean) => {
                    setSelectedSpecs((prev: string[]) => {
                      if (v) return Array.from(new Set([...prev, c]))
                      return prev.filter((x: string) => x !== c)
                    })
                  }}
                >{c}</DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* radius, match skills, and reset removed by request */}
    </div>
  )
}
