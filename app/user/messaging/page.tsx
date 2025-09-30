"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Sample data (can be wired to API later)
const mailsData = [
  {
    name: "Campus Housing",
    email: "housing@university.edu",
    subject: "Move‑In shift details",
    date: "09:12 AM",
    teaser:
      "Thanks for signing up for Move‑In!\nPlease arrive 15 minutes early at North Res Halls. Dress comfortably.",
  },
  {
    name: "BrightKids",
    email: "volunteer@brightkids.org",
    subject: "STEM Tutor schedule",
    date: "Yesterday",
    teaser:
      "Could you share your availability this week?\nWe’re planning sessions Tue/Thu evenings.",
  },
  {
    name: "City Parks",
    email: "events@cityparks.gov",
    subject: "Park Cleanup logistics",
    date: "2 days ago",
    teaser:
      "Meet at the Riverfront pavilion.\nGloves and bags provided. Water stations on site.",
  },
]

export default function Page() {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<typeof mailsData[number] | null>(null)
  const [reply, setReply] = React.useState("")
  const [showOriginal, setShowOriginal] = React.useState(false)

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

  const mails = React.useMemo(() => {
    if (!query) return mailsData
    const q = query.toLowerCase()
    return mailsData.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.teaser.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div className="flex min-h-[600px] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-base font-medium">Inbox</div>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{mails.length}</span>
        </div>
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <ul className="divide-y rounded-md border">
        {mails.map((mail) => (
          <li
            key={mail.email}
            className="group cursor-pointer p-3 md:p-4 transition hover:bg-muted/40"
            onClick={() => {
              setSelected(mail)
              setReply("")
              setShowOriginal(false)
              setOpen(true)
            }}
          >
            <div className="flex items-start gap-3">
              <div className="bg-muted text-foreground/80 flex size-8 select-none items-center justify-center rounded-full text-xs font-medium">
                {getInitials(mail.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{mail.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{mail.date}</span>
                </div>
                <div className="truncate text-sm">{mail.subject}</div>
                <div className="text-xs text-muted-foreground whitespace-break-spaces line-clamp-2">
                  {mail.teaser}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg">Reply to {selected?.name}</DialogTitle>
            <DialogDescription className="truncate text-xs">
              Subject: {selected?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selected && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="bg-muted text-foreground/80 flex size-6 select-none items-center justify-center rounded-full text-[10px] font-medium">
                  {getInitials(selected.name)}
                </div>
                <div className="truncate">
                  <span className="font-medium text-foreground/80">{selected.name}</span>
                  <span className="mx-1">•</span>
                  <span className="truncate align-middle">{selected.email}</span>
                </div>
                <span className="ml-auto shrink-0">{selected.date}</span>
              </div>
            )}
            <button
              type="button"
              className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              aria-expanded={showOriginal}
              onClick={() => setShowOriginal((v) => !v)}
            >
              {showOriginal ? "Hide original" : "Show original"}
            </button>
            {showOriginal && (
              <div className="whitespace-pre-line rounded-md border-l-2 border-border/60 bg-muted/30 p-3 pl-4 text-xs text-muted-foreground">
                {selected?.teaser}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="reply" className="text-xs font-medium text-muted-foreground">Your reply</label>
              <textarea
                id="reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && reply.trim()) {
                    e.preventDefault()
                    // TODO: wire to send API
                    setOpen(false)
                  }
                }}
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder={`Hi ${selected?.name?.split(' ')[0] || 'there'}, ...`}
                autoFocus
              />
              <div className="text-[10px] text-muted-foreground">Press ⌘/Ctrl + Enter to send</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  // TODO: wire to send API
                  setOpen(false)
                }}
                disabled={!reply.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
