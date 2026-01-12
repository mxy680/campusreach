"use client"

import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { IconSearch, IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconTrash, IconCheck } from "@tabler/icons-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

type Volunteer = {
  id: string
  firstName: string
  lastName: string
  name: string
  image: string | null
  phone: string | null
  major: string | null
  signedUpAt: string | null
  totalHours: number
  hoursVerified: boolean
  isEventOver: boolean
  signupId: string | null
}

type Event = {
  id: string
  title: string
  startsAt: string
  endsAt: string | null
}

const COLUMNS = [
  { id: "profile", label: "Profile", defaultVisible: true },
  { id: "name", label: "Volunteer Name", defaultVisible: true },
  { id: "phone", label: "Phone Number", defaultVisible: true },
  { id: "major", label: "Major", defaultVisible: true },
  { id: "signedUpAt", label: "Signed Up At", defaultVisible: true },
  { id: "totalHours", label: "Total Hours", defaultVisible: true },
  { id: "verifyHours", label: "Verify Hours", defaultVisible: true },
  { id: "remove", label: "Remove", defaultVisible: true },
]

export default function VolunteersPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [events, setEvents] = useState<Event[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id))
  )
  const [removing, setRemoving] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [volunteerToRemove, setVolunteerToRemove] = useState<{ id: string; name: string } | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)

  // Fetch events list on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Call API without eventId to get events list
        const response = await fetch(`/api/org/volunteers?page=1&pageSize=1`)
        if (!response.ok) throw new Error("Failed to fetch events")
        const data = await response.json()
        setEvents(data.events || [])
        // Auto-select first event if available and none is selected
        if (data.events && data.events.length > 0) {
          setSelectedEventId((prev) => prev || data.events[0].id)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }
    fetchEvents()
  }, [])

  const fetchVolunteers = useCallback(async () => {
    if (!selectedEventId) {
      setVolunteers([])
      setTotal(0)
      setTotalPages(0)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("eventId", selectedEventId)
      params.append("page", page.toString())
      params.append("pageSize", pageSize.toString())

      const response = await fetch(`/api/org/volunteers?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch volunteers")
      const data = await response.json()
      setEvents(data.events || [])
      setVolunteers(data.volunteers || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
    } catch (error) {
      console.error("Error fetching volunteers:", error)
      toast.error("Failed to load volunteers")
    } finally {
      setLoading(false)
    }
  }, [search, selectedEventId, page, pageSize])

  useEffect(() => {
    fetchVolunteers()
  }, [fetchVolunteers])

  const handleRemoveClick = (volunteerId: string, volunteerName: string) => {
    setVolunteerToRemove({ id: volunteerId, name: volunteerName })
    setDialogOpen(true)
  }

  const handleVerifyHours = async (signupId: string, currentValue: boolean) => {
    if (!signupId) return

    setVerifying(signupId)
    try {
      const response = await fetch("/api/org/volunteers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signupId,
          hoursVerified: !currentValue,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update verification")
      }

      // Update the local state
      setVolunteers((prev) =>
        prev.map((v) =>
          v.signupId === signupId
            ? { ...v, hoursVerified: !currentValue }
            : v
        )
      )

      toast.success(
        !currentValue
          ? "Hours verified successfully"
          : "Verification removed"
      )
    } catch (error: unknown) {
      console.error("Error updating verification:", error)
      const message = error instanceof Error ? error.message : "Failed to update verification"
      toast.error(message)
    } finally {
      setVerifying(null)
    }
  }

  const handleRemoveConfirm = async () => {
    if (!selectedEventId || !volunteerToRemove) return

    setRemoving(volunteerToRemove.id)
    setDialogOpen(false)
    
    try {
      const params = new URLSearchParams()
      params.append("volunteerId", volunteerToRemove.id)
      params.append("eventId", selectedEventId)

      const response = await fetch(`/api/org/volunteers?${params.toString()}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove volunteer")
      }

      toast.success("Volunteer removed successfully")
      fetchVolunteers()
    } catch (error: unknown) {
      console.error("Error removing volunteer:", error)
      const message = error instanceof Error ? error.message : "Failed to remove volunteer"
      toast.error(message)
    } finally {
      setRemoving(null)
      setVolunteerToRemove(null)
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatHours = (hours: number) => {
    return hours.toFixed(1)
  }

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(columnId)) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-2">
            <span className="font-medium">Volunteer Management</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Event Selection, Search and Column Selection */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Select
              value={selectedEventId}
              onValueChange={(value) => {
                setSelectedEventId(value)
                setPage(1) // Reset to first page on event change
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} ({formatEventDate(event.startsAt)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1) // Reset to first page on search
                }}
                placeholder="Search volunteers..."
                className="pl-9"
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Select columns
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {visibleColumns.has("profile") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Profile
                    </th>
                  )}
                  {visibleColumns.has("name") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Volunteer Name
                    </th>
                  )}
                  {visibleColumns.has("phone") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Phone Number
                    </th>
                  )}
                  {visibleColumns.has("major") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Major
                    </th>
                  )}
                  {visibleColumns.has("signedUpAt") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Signed Up At
                    </th>
                  )}
                  {visibleColumns.has("totalHours") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Total Hours
                    </th>
                  )}
                  {visibleColumns.has("verifyHours") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Verify Hours
                    </th>
                  )}
                  {visibleColumns.has("remove") && (
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Remove
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {!selectedEventId ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.size}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Please select an event to view volunteers.
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.size}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : volunteers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.size}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results.
                    </td>
                  </tr>
                ) : (
                  volunteers.map((volunteer) => (
                    <tr
                      key={volunteer.id}
                      className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={(e) => {
                        // Don't navigate if clicking on the remove button
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('[role="button"]')) {
                          return
                        }
                        router.push(`/vol/${volunteer.id}`)
                      }}
                    >
                      {visibleColumns.has("profile") && (
                        <td className="h-16 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <Avatar className="h-10 w-10">
                              {volunteer.image && (
                                <AvatarImage src={volunteer.image} alt={volunteer.name} />
                              )}
                              <AvatarFallback>
                                {volunteer.firstName.charAt(0)}
                                {volunteer.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </td>
                      )}
                      {visibleColumns.has("name") && (
                        <td className="h-16 px-4 text-center">{volunteer.name}</td>
                      )}
                      {visibleColumns.has("phone") && (
                        <td className="h-16 px-4 text-center text-muted-foreground">
                          {volunteer.phone || "N/A"}
                        </td>
                      )}
                      {visibleColumns.has("major") && (
                        <td className="h-16 px-4 text-center text-muted-foreground">
                          {volunteer.major || "N/A"}
                        </td>
                      )}
                      {visibleColumns.has("signedUpAt") && (
                        <td className="h-16 px-4 text-center text-muted-foreground">
                          {formatDate(volunteer.signedUpAt)}
                        </td>
                      )}
                      {visibleColumns.has("totalHours") && (
                        <td className="h-16 px-4 text-center text-muted-foreground">
                          {formatHours(volunteer.totalHours)}
                        </td>
                      )}
                      {visibleColumns.has("verifyHours") && (
                        <td className="h-16 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {volunteer.signupId ? (
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={volunteer.hoursVerified}
                                onCheckedChange={() =>
                                  handleVerifyHours(volunteer.signupId!, volunteer.hoursVerified)
                                }
                                disabled={verifying === volunteer.signupId || !volunteer.isEventOver}
                                className="cursor-pointer"
                                title={
                                  !volunteer.isEventOver
                                    ? "Event must be over to verify hours"
                                    : volunteer.hoursVerified
                                    ? "Hours verified"
                                    : "Verify hours"
                                }
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.has("remove") && (
                        <td className="h-16 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveClick(volunteer.id, volunteer.name)}
                              disabled={removing === volunteer.id}
                              className="text-destructive hover:text-destructive h-8 w-8"
                              title="Remove volunteer"
                            >
                              {removing === volunteer.id ? (
                                <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <IconTrash className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total volunteers: {total}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Volunteers per page</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value, 10))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {totalPages > 0 ? page : 0} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                >
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages || loading}
                >
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Volunteer</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {volunteerToRemove?.name} from{" "}
              {selectedEventId ? events.find((e) => e.id === selectedEventId)?.title || "this event" : "this event"}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setVolunteerToRemove(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirm}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}

