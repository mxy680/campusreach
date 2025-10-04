"use client"

export type Opportunity = {
  id: string
  title: string
  org: string
  orgSlug?: string
  teaser: string
  start: string // ISO
  end?: string // ISO
  location: string
  need: number
  joined: number
  attachments?: string[]
  attendees?: string[]
  skills: string[]
  hours?: number
  notes?: string
  alreadyJoined?: boolean
}
