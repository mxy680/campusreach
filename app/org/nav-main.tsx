"use client"

import React from "react"
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const [selectedSpecialties, setSelectedSpecialties] = React.useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [title, setTitle] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [datetime, setDatetime] = React.useState("")
  const [volunteers, setVolunteers] = React.useState<number | "">("")
  const [submitting, setSubmitting] = React.useState(false)
  const specialtyOptions: string[] = [
    "Environmental Science",
    "Public Health",
    "Computer Science",
    "Business",
    "Education",
    "Biology",
    "Mechanical Engineering",
    "Nursing",
  ]
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton
                  tooltip="Schedule Event"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconCirclePlusFilled />
                  <span>Schedule Event</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule an Event</DialogTitle>
                  <DialogDescription>
                    Set up your organization’s upcoming event. We’ll add fields next.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!title || !datetime || !volunteers) return
                    try {
                      setSubmitting(true)
                      const fd = new FormData()
                      fd.append("title", title)
                      fd.append("shortDescription", desc)
                      fd.append("startsAt", new Date(datetime).toISOString())
                      fd.append("volunteersNeeded", String(volunteers))
                      fd.append("specialties", JSON.stringify(selectedSpecialties))
                      for (const f of selectedFiles) fd.append("attachments", f, f.name)
                      const res = await fetch("/api/org/events", { method: "POST", body: fd })
                      if (!res.ok) throw new Error("Failed to create event")
                      // reset
                      setTitle("")
                      setDesc("")
                      setDatetime("")
                      setVolunteers("")
                      setSelectedSpecialties([])
                      setSelectedFiles([])
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Title</Label>
                    <Input id="event-title" placeholder="e.g. Campus Cleanup Day" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-desc">Short description</Label>
                    <textarea
                      id="event-desc"
                      className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Briefly describe the event"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="event-datetime">Date & time</Label>
                      <Input id="event-datetime" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-volunteers">Number of volunteers needed</Label>
                      <Input id="event-volunteers" type="number" min={1} placeholder="e.g. 10" value={volunteers} onChange={(e) => setVolunteers(e.target.value ? Number(e.target.value) : "")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="relative w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <div className="pointer-events-none flex min-h-6 flex-wrap items-center gap-1.5">
                        {selectedFiles.length > 0 ? (
                          <>
                            {selectedFiles.slice(0, 3).map((f) => (
                              <Badge key={f.name + f.size} variant="secondary">{f.name}</Badge>
                            ))}
                            {selectedFiles.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{selectedFiles.length - 3}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Click to choose files</span>
                        )}
                      </div>
                      <input
                        aria-label="Upload attachments"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        type="file"
                        multiple
                        onChange={(e) => {
                          const list = e.target.files
                          if (!list) return
                          const picked = Array.from(list)
                          setSelectedFiles((prev) => {
                            const map = new Map<string, File>(prev.map((f) => [f.name + f.size, f]))
                            for (const f of picked) {
                              map.set(f.name + f.size, f)
                            }
                            return Array.from(map.values())
                          })
                          // reset input so the same files can be picked again
                          e.currentTarget.value = ""
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Desired specialties/majors</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {selectedSpecialties.length > 0 ? (
                            <div className="flex items-center gap-1.5 truncate">
                              {selectedSpecialties.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                              {selectedSpecialties.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{selectedSpecialties.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Select specialties</span>
                          )}
                          <ChevronDown className="ml-2 size-4 opacity-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-72">
                        {selectedSpecialties.length > 0 && (
                          <div className="px-2 py-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              {selectedSpecialties.map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Select all */}
                        <DropdownMenuCheckboxItem
                          checked={selectedSpecialties.length === specialtyOptions.length}
                          onCheckedChange={(isChecked) => {
                            setSelectedSpecialties(isChecked ? [...specialtyOptions] : [])
                          }}
                        >
                          Select all
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {specialtyOptions.map((opt) => {
                          const checked = selectedSpecialties.includes(opt)
                          return (
                            <DropdownMenuCheckboxItem
                              key={opt}
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                setSelectedSpecialties((prev) =>
                                  isChecked ? [...prev, opt] : prev.filter((v) => v !== opt)
                                )
                              }}
                            >
                              {opt}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={submitting || !title || !datetime || !volunteers}>
                      {submitting ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
