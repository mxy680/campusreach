"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
// removed charting and toast imports as they are not used in this variant
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
// removed chart components as they are not used in this variant
// removed Checkbox (no selection or accepted columns)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// removed drawer components as they are not used in this variant
// removed dropdown menu; using a lightweight combobox panel instead
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// removed separator as it is not used in this variant
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TableMeta = {
  deleteRow: (row: z.infer<typeof schema>) => void
}

// Deterministic date formatting (UTC, locale-independent) to avoid hydration mismatches
function formatDateUTC(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDateTimeUTC(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const hh = String(d.getUTCHours()).padStart(2, "0")
  const mm = String(d.getUTCMinutes()).padStart(2, "0")
  return `${y}-${m}-${day} ${hh}:${mm} UTC`
}

export const schema = z.object({
  id: z.number(),
  volunteerId: z.string().optional().nullable(),
  volunteerSlug: z.string().optional().nullable(),
  volunteerName: z.string(),
  pronouns: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
  gradDate: z.string().optional().nullable(),
  signedUpAt: z.string().optional().nullable(),
  accepted: z.boolean().default(false),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  totalHours: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-6 p-0 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "profile",
    header: () => <div className="w-[44px] mx-auto text-center">Profile</div>,
    cell: ({ row }) => {
      const name: string = row.original.volunteerName
      const src: string | null | undefined = row.original.avatarUrl
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
      return (
        <div className="w-[44px] mx-auto px-1 flex items-center justify-center">
          <Avatar className="h-7 w-7">
            <AvatarImage src={src ?? undefined} alt={name} />
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "volunteerName",
    header: () => (
      <div className="w-full text-center truncate max-w-[16ch]">Volunteer Name</div>
    ),
    cell: ({ row }) => (
      <div className="px-2 text-center truncate max-w-[16ch]">
        {row.original.volunteerName || "Unknown"}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: () => <div className="w-full text-center truncate max-w-[22ch]">Email</div>,
    cell: ({ row }) => (
      <div className="px-2 text-center truncate max-w-[22ch]">{row.original.email || "—"}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: () => (
      <div className="w-full text-center truncate max-w-[14ch]">Phone Number</div>
    ),
    cell: ({ row }) => (
      <div className="px-2 text-center truncate max-w-[14ch]">
        {row.original.phone || "—"}
      </div>
    ),
  },
  {
    accessorKey: "pronouns",
    header: () => <div className="w-full text-center truncate max-w-[10ch]">Pronouns</div>,
    cell: ({ row }) => (
      <div className="px-2 w-full flex items-center justify-center">
        <Badge variant="outline" className="text-muted-foreground px-1 text-xs">
          {row.original.pronouns || "—"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "major",
    header: () => <div className="w-full text-center truncate max-w-[16ch]">Major</div>,
    cell: ({ row }) => (
      <div className="px-2 text-center truncate max-w-[16ch]">
        {row.original.major || "—"}
      </div>
    ),
  },
  {
    accessorKey: "gradDate",
    header: () => <div className="w-full text-center truncate max-w-[12ch]">Grad Date</div>,
    cell: ({ row }) => {
      const v = row.original.gradDate
      return (
        <div className="px-2 text-center truncate max-w-[12ch]">{formatDateUTC(v)}</div>
      )
    },
  },
  {
    accessorKey: "signedUpAt",
    header: () => (
      <div className="w-full text-center truncate max-w-[18ch]">Signed Up At</div>
    ),
    cell: ({ row }) => {
      const v = row.original.signedUpAt
      return (
        <div className="px-2 text-center truncate max-w-[18ch]">{formatDateTimeUTC(v)}</div>
      )
    },
  },
  {
    accessorKey: "totalHours",
    header: () => <div className="w-full text-center">Total Hours</div>,
    cell: ({ row }) => (
      <div className="px-2 w-[6ch] mx-auto text-center">
        {row.original.totalHours ?? 0}
      </div>
    ),
  },
  {
    accessorKey: "notes",
    header: () => <div className="w-full text-center truncate max-w-[22ch]">Notes</div>,
    cell: ({ row }) => (
      <div className="px-2 text-center truncate max-w-[22ch] text-muted-foreground">
        {row.original.notes || ""}
      </div>
    ),
  },
  // Actions column with delete button (last)
  {
    id: "actions",
    header: () => <div className="w-[44px] mx-auto text-center">Remove</div>,
    enableHiding: false,
    cell: ({ row, table }) => (
      <div className="w-[44px] mx-auto px-1 flex items-center justify-center">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          onClick={(e) => {
            e.stopPropagation()
            ;(table.options.meta as unknown as TableMeta)?.deleteRow?.(row.original)
          }}
          aria-label="Delete row"
        >
          <IconTrash className="size-4" />
        </Button>
      </div>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-accent/40 cursor-pointer"
      onClick={() => {
        const slug = row.original.volunteerSlug
        if (slug) {
          window.open(`/v/${slug}` , "_blank", "noopener,noreferrer")
        }
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data,
  eventOptions,
  eventValue,
  onEventChange,
}: {
  data: z.infer<typeof schema>[]
  eventOptions: { id: string; label: string }[]
  eventValue: string
  onEventChange: (id: string) => void
}) {
  const [rows, setRows] = React.useState(() => data)
  const [columnsOpen, setColumnsOpen] = React.useState(false)
  const [columnsQuery, setColumnsQuery] = React.useState("")
  const [viewValue, setViewValue] = React.useState("outline")
  // Event combobox state (UI only)
  const [eventOpen, setEventOpen] = React.useState(false)
  const [eventQuery, setEventQuery] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      email: false,
      pronouns: false,
      notes: false,
      gradDate: false,
      // Always show profile and actions; kept here for clarity though enableHiding=false enforces it
      profile: true,
      actions: true,
    })
  const [visibilityHydrated, setVisibilityHydrated] = React.useState(false)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => rows?.map(({ id }) => id) || [],
    [rows]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    meta: {
      deleteRow: async (row: z.infer<typeof schema>) => {
        try {
          if (!row.volunteerId) {
            toast.error("Missing volunteer id")
            return
          }
          const res = await fetch("/api/org/volunteers", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: eventValue, volunteerId: row.volunteerId }),
          })
          if (!res.ok) throw new Error("Failed to remove volunteer")
          setRows((prev: Array<z.infer<typeof schema>>) => prev.filter((r) => r.id !== row.id))
          toast.success("Volunteer removed")
        } catch {
          toast.error("Could not remove volunteer")
        }
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setRows((curr) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(curr, oldIndex, newIndex)
      })
    }
  }

  // Keep internal rows in sync if parent changes rows
  React.useEffect(() => {
    setRows(data)
  }, [data])

  // Restore column visibility from localStorage (once)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("org:table:columnVisibility")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          // Ensure always-visible columns remain visible
          const next: VisibilityState = {
            ...parsed,
            profile: true,
            actions: true,
          }
          setColumnVisibility(next)
        }
      }
    } finally {
      setVisibilityHydrated(true)
    }
  }, [])

  // Persist column visibility on change (after hydration)
  React.useEffect(() => {
    if (!visibilityHydrated) return
    try {
      localStorage.setItem("org:table:columnVisibility", JSON.stringify(columnVisibility))
    } catch {}
  }, [columnVisibility, visibilityHydrated])

  return (
    <Tabs value={viewValue} onValueChange={(val) => setViewValue(val)} className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="relative @4xl/main:hidden">
          <Label htmlFor="event-combobox" className="sr-only">Event</Label>
          <Button
            variant="outline"
            size="sm"
            className="w-64 justify-between"
            onClick={() => setEventOpen((o) => !o)}
          >
            <span className="truncate">
              {eventOptions.find((e) => e.id === eventValue)?.label ?? "Select Event"}
            </span>
            <IconChevronDown className={`ml-2 shrink-0 transition ${eventOpen ? "rotate-180" : ""}`} />
          </Button>
          {eventOpen && (
            <div className="absolute z-20 mt-2 w-64 rounded-md border bg-popover p-2 shadow-md">
              <Input
                id="event-combobox"
                placeholder="Search events..."
                className="h-8 mb-2"
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
              />
              <div className="max-h-56 overflow-auto">
                {eventOptions
                  .filter((opt) => opt.label.toLowerCase().includes(eventQuery.toLowerCase()))
                  .map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-accent"
                      onClick={() => {
                        onEventChange(opt.id)
                        setEventOpen(false)
                      }}
                    >
                      <span className={`size-2 rounded-sm border ${eventValue === opt.id ? "bg-primary" : "bg-transparent"}`} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="w-44 justify-between"
              onClick={() => setColumnsOpen((o) => !o)}
            >
              <span className="hidden lg:inline truncate">Select columns</span>
              <span className="lg:hidden truncate">Columns</span>
              <IconChevronDown className={`ml-2 shrink-0 transition ${columnsOpen ? "rotate-180" : ""}`} />
            </Button>
            {columnsOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border bg-popover p-2 shadow-md">
                <Input
                  placeholder="Filter columns..."
                  className="h-8 mb-2"
                  value={columnsQuery}
                  onChange={(e) => setColumnsQuery(e.target.value)}
                />
                <div className="max-h-56 overflow-auto">
                  {table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" && column.getCanHide()
                    )
                    .filter((column) =>
                      column.id.toLowerCase().includes(columnsQuery.toLowerCase())
                    )
                    .map((column) => (
                      <button
                        key={column.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-accent"
                        onClick={() => column.toggleVisibility(!column.getIsVisible())}
                      >
                        <span
                          className={`size-2 rounded-sm border ${
                            column.getIsVisible() ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                        <span className="capitalize">{column.id}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-y-auto px-4 lg:px-6"
      >
        <div className="w-full max-w-full overflow-x-auto rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table className="w-full table-fixed">
              <TableHeader className="bg-muted sticky top-0 z-10 **:data-[slot=table-head]:px-2 **:data-[slot=table-head]:first:w-6">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:px-2 **:data-[slot=table-cell]:first:w-6">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getVisibleLeafColumns().length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Total volunteers: {table.getCoreRowModel().rows.length}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Volunteers per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

// removed chart data/config and TableCellViewer component in this simplified table variant