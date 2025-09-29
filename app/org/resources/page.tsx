"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const faqs = [
  {
    q: "How do I post an opportunity?",
    a: "Go to Org > Opportunities and use the Create form. Add title, date, volunteers needed, and an optional flyer image. Click Create Opportunity to publish.",
  },
  {
    q: "How does transportation work?",
    a: "Transportation options vary by campus. Include meeting location and transit notes in the opportunity description. Students will see logistics on the event details page.",
  },
  {
    q: "How do I contact ambassadors?",
    a: "Use the Message Students feature from the Dashboard or reach out to your campus ambassador via the Support form below. We'll route it to the right person.",
  },
  {
    q: "Can multiple staff manage our org account?",
    a: "Yes. Invite teammates on the Settings page under Team Members. Assign roles (Owner/Admin/Member) and manage access anytime.",
  },
  {
    q: "How do I track hours?",
    a: "Students log hours from their portal. You can view totals on the Dashboard and export reports from the Volunteers page (export coming soon).",
  },
]

 

export default function Page() {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [openIdx, setOpenIdx] = React.useState<number | null>(0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !message) return
    try {
      setSubmitting(true)
      // TODO: wire to API or chat backend
      await new Promise((r) => setTimeout(r, 600))
      setSubmitted(true)
      setName("")
      setEmail("")
      setMessage("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* FAQs */}
        <Card className="md:col-span-2 h-[480px]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">FAQs for Organizations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-y-auto max-h-[420px]">
            <div className="space-y-2">
              {faqs.map((f, i) => (
                <div key={i} className="rounded border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3 text-left font-medium hover:bg-muted/40"
                    aria-expanded={openIdx === i}
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  >
                    {f.q}
                  </button>
                  {openIdx === i && (
                    <div className="p-3 pt-0 text-sm text-muted-foreground">{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="h-[480px]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 overflow-y-auto max-h-[420px]">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@org.org" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  required
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={submitting || !email || !message}>
                  {submitting ? "Sending..." : "Send message"}
                </Button>
                <Button type="button" variant="outline" disabled>
                  Start chat (coming soon)
                </Button>
              </div>
              {submitted && <p className="text-xs text-green-600">Thanks! We received your message.</p>}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Tutorials removed per request */}
    </main>
  )
}
