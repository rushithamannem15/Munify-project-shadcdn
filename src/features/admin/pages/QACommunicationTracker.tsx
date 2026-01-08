import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  TrendingUp,
  Bell,
  MoreHorizontal,
  Filter,
  Calendar as CalendarIcon,
  Download,
  CheckCircle2,
  Flag,
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import Chart from "react-apexcharts"
import type { ApexOptions } from "apexcharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { alerts } from "@/lib/alerts"

interface QaRow {
  id: string
  project: string
  municipality: string
  askedBy: string
  question: string
  category: string
  askedDate: string
  status: "open" | "answered" | "escalated"
  response?: string
  responseDate?: string
  responseTimeHours?: number
  slaStatus: "on_time" | "warning" | "overdue"
}

interface MeetingRow {
  id: string
  project: string
  municipality: string
  requestedBy: string
  scheduledAt?: string
  status: string
  recordingUrl?: string
}

interface EscalatedQuery {
  id: string
  project: string
  municipality: string
  askedBy: string
  question: string
  escalationReason?: string
  escalationDate: string
  resolutionStatus: "pending" | "in_progress" | "resolved"
}

interface QaSummary {
  totalQueries: number
  openQueries: number
  answeredQueries: number
  averageResponseTimeHours: number
  slaComplianceRate: number
  escalatedQueries: number
  pendingMeetingRequests: number
}

interface QaMonitoringResponse {
  summary: QaSummary
  queries: QaRow[]
  meetings: MeetingRow[]
  escalatedQueries?: EscalatedQuery[]
}

// Hardcoded dummy data for Q&A & communication tracker
const MOCK_QA: QaMonitoringResponse = {
  summary: {
    totalQueries: 23,
    openQueries: 6,
    answeredQueries: 15,
    averageResponseTimeHours: 62,
    slaComplianceRate: 78.5,
    escalatedQueries: 2,
    pendingMeetingRequests: 3,
  },
  queries: [
    {
      id: "Q-101",
      project: "Smart Street Lighting Upgrade",
      municipality: "Pune Municipal Corporation",
      askedBy: "XYZ Green Fund",
      question: "Please share the detailed O&M cost assumptions used in the DPR.",
      category: "Financial",
      askedDate: "2024-10-08T00:00:00.000Z",
      status: "answered",
      response: "O&M costs are indexed to CPI with 4% annual escalation.",
      responseDate: "2024-10-11T00:00:00.000Z",
      responseTimeHours: 72,
      slaStatus: "on_time",
    },
    {
      id: "Q-102",
      project: "Urban Mobility Bus Fleet Renewal",
      municipality: "Ahmedabad Municipal Corporation",
      askedBy: "Urban Mobility Fund",
      question: "Clarify the ticketing revenue sharing mechanism with the SPV.",
      category: "Financial",
      askedDate: "2024-10-15T00:00:00.000Z",
      status: "open",
      response: undefined,
      responseDate: undefined,
      responseTimeHours: undefined,
      slaStatus: "warning",
    },
    {
      id: "Q-103",
      project: "Sewage Treatment Plant Modernization",
      municipality: "Chennai Corporation",
      askedBy: "ABC Infrastructure Finance Ltd.",
      question: "Provide latest consent-to-operate from the pollution control board.",
      category: "Compliance",
      askedDate: "2024-10-05T00:00:00.000Z",
      status: "escalated",
      response: undefined,
      responseDate: undefined,
      responseTimeHours: 160,
      slaStatus: "overdue",
    },
  ],
  meetings: [
    {
      id: "M-501",
      project: "Smart Street Lighting Upgrade",
      municipality: "Pune Municipal Corporation",
      requestedBy: "XYZ Green Fund",
      scheduledAt: "2024-10-22T10:30:00.000Z",
      status: "Scheduled",
      recordingUrl: undefined,
    },
    {
      id: "M-502",
      project: "Urban Mobility Bus Fleet Renewal",
      municipality: "Ahmedabad Municipal Corporation",
      requestedBy: "Urban Mobility Fund",
      scheduledAt: undefined,
      status: "Pending scheduling",
      recordingUrl: undefined,
    },
  ],
  escalatedQueries: [
    {
      id: "Q-103",
      project: "Sewage Treatment Plant Modernization",
      municipality: "Chennai Corporation",
      askedBy: "ABC Infrastructure Finance Ltd.",
      question: "Provide latest consent-to-operate from the pollution control board.",
      escalationReason: "No response received after 7 days",
      escalationDate: "2024-10-12T00:00:00.000Z",
      resolutionStatus: "pending",
    },
  ],
}

function formatDateTime(dateString?: string) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Multi-select component for filters
function MultiSelectFilter({
  label,
  options,
  selected,
  onSelectionChange,
  placeholder = "Select...",
}: {
  label: string
  options: string[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onSelectionChange(selected.filter((s) => s !== value))
    } else {
      onSelectionChange([...selected, value])
    }
  }

  const displayText = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>{displayText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2">
          <div className="text-sm font-semibold mb-2 px-2">{label}</div>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => handleToggle(option)}>
                <Checkbox checked={selected.includes(option)} onCheckedChange={() => handleToggle(option)} />
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onSelectionChange([])}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function QACommunicationTracker() {
  // Filter states
  const [projectFilter, setProjectFilter] = useState<string[]>([])
  const [municipalityFilter, setMunicipalityFilter] = useState<string[]>([])
  const [lenderFilter, setLenderFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [slaStatusFilter, setSlaStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const { data, isLoading, isError, error } = useQuery<QaMonitoringResponse>({
    queryKey: ["admin-monitoring", "qa"],
    // Hardcoded dummy data to render the screen without backend
    queryFn: async () => MOCK_QA,
  })

  const summary = data?.summary
  const allQueries: QaRow[] = useMemo(
    () => (Array.isArray(data?.queries) ? data?.queries : []) || [],
    [data?.queries],
  )
  const meetings: MeetingRow[] = useMemo(
    () => (Array.isArray(data?.meetings) ? data?.meetings : []) || [],
    [data?.meetings],
  )
  const escalatedQueries = data?.escalatedQueries ?? []

  // Extract unique values for filters
  const projects = useMemo(() => Array.from(new Set(allQueries.map((q) => q.project))).sort(), [allQueries])
  const municipalities = useMemo(() => Array.from(new Set(allQueries.map((q) => q.municipality))).sort(), [allQueries])
  const lenders = useMemo(() => Array.from(new Set(allQueries.map((q) => q.askedBy))).sort(), [allQueries])
  const categories = useMemo(() => Array.from(new Set(allQueries.map((q) => q.category))).sort(), [allQueries])

  // Filtered queries
  const queries = useMemo(() => {
    return allQueries.filter((q) => {
      if (projectFilter.length > 0 && !projectFilter.includes(q.project)) return false
      if (municipalityFilter.length > 0 && !municipalityFilter.includes(q.municipality)) return false
      if (lenderFilter.length > 0 && !lenderFilter.includes(q.askedBy)) return false
      if (statusFilter !== "all" && q.status !== statusFilter) return false
      if (categoryFilter.length > 0 && !categoryFilter.includes(q.category)) return false
      if (slaStatusFilter !== "all" && q.slaStatus !== slaStatusFilter) return false
      if (dateRange?.from && new Date(q.askedDate) < dateRange.from) return false
      if (dateRange?.to && new Date(q.askedDate) > dateRange.to) return false
      return true
    })
  }, [allQueries, projectFilter, municipalityFilter, lenderFilter, statusFilter, categoryFilter, slaStatusFilter, dateRange])

  // Calculate overdue queries count
  const overdueQueriesCount = useMemo(() => {
    return allQueries.filter((q) => q.slaStatus === "overdue").length
  }, [allQueries])

  // Calculate queries answered within 7 days
  const queriesWithin7Days = useMemo(() => {
    const answered = allQueries.filter((q) => q.status === "answered" && q.responseTimeHours !== undefined)
    const within7Days = answered.filter((q) => (q.responseTimeHours || 0) <= 168) // 7 days = 168 hours
    return answered.length > 0 ? (within7Days.length / answered.length) * 100 : 0
  }, [allQueries])

  // Calculate response time trends data for chart
  const responseTimeTrends = useMemo(() => {
    const trends: Array<{ date: string; avgResponseTime: number }> = []
    const dateMap = new Map<string, number[]>()
    
    allQueries.forEach((q) => {
      if (q.responseTimeHours !== undefined && q.askedDate) {
        const date = new Date(q.askedDate)
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
        const existing = dateMap.get(weekKey) || []
        existing.push(q.responseTimeHours)
        dateMap.set(weekKey, existing)
      }
    })
    
    dateMap.forEach((times, weekKey) => {
      const avg = times.reduce((sum, t) => sum + t, 0) / times.length
      trends.push({ date: weekKey, avgResponseTime: avg })
    })
    
    return trends.sort((a, b) => a.date.localeCompare(b.date))
  }, [allQueries])


  const handleViewQuery = (query: QaRow) => {
    // TODO: Implement view query details
    alerts.success("View Query", `Viewing query ${query.id}`)
  }

  const handleSendNotification = (query: QaRow) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for query ${query.id}`)
  }

  const handleSendReminderToMunicipality = (municipality: string) => {
    alerts.success("Reminder Sent", `Reminder sent to ${municipality}`)
  }

  const handleMarkResolved = (escalatedQuery: EscalatedQuery) => {
    alerts.success("Marked Resolved", `Query ${escalatedQuery.id} marked as resolved`)
  }

  const handleExportReport = () => {
    alerts.success("Export Started", "Exporting Q&A report to Excel")
  }

  const handleResetFilters = () => {
    setProjectFilter([])
    setMunicipalityFilter([])
    setLenderFilter([])
    setStatusFilter("all")
    setCategoryFilter([])
    setSlaStatusFilter("all")
    setDateRange(undefined)
  }

  const toggleRowExpansion = (queryId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [queryId]: !prev[queryId],
    }))
  }

  const columns: ColumnDef<QaRow, any>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Query ID
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.id}</span>,
    },
    {
      accessorKey: "project",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Project
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const query = row.original
        return (
          <button
            onClick={() => handleViewQuery(query)}
            className="min-w-[200px] text-left hover:underline"
          >
            <div className="font-medium text-foreground text-blue-600 dark:text-blue-400">{query.project}</div>
          </button>
        )
      },
    },
    {
      accessorKey: "municipality",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Municipality
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm">{row.original.municipality}</span>,
    },
    {
      accessorKey: "askedBy",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Asked By
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm">{row.original.askedBy}</span>,
    },
    {
      accessorKey: "question",
      header: "Question",
      cell: ({ row }) => {
        const query = row.original
        const isExpanded = expandedRows[query.id]
        return (
          <div className="min-w-[250px]">
            <div className="flex items-start gap-2">
              <span className={cn("text-sm text-foreground", !isExpanded && "line-clamp-2")}>
                {query.question}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleRowExpansion(query.id)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm">{row.original.category}</span>,
    },
    {
      accessorKey: "askedDate",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Asked Date
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateTime(row.original.askedDate)}</span>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "open") {
          return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 text-xs">
              Open
            </Badge>
          )
        }
        if (status === "answered") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Answered
            </Badge>
          )
        }
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 text-xs">
            Escalated
          </Badge>
        )
      },
    },
    {
      accessorKey: "response",
      header: "Response",
      cell: ({ row }) => {
        const query = row.original
        if (!query.response) return <span className="text-xs text-muted-foreground">—</span>
        const isExpanded = expandedRows[query.id]
        return (
          <div className="min-w-[200px]">
            <div className="flex items-start gap-2">
              <span className={cn("text-xs text-foreground", !isExpanded && "line-clamp-2")}>
                {query.response}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "responseDate",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Response Date
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateTime(row.original.responseDate)}</span>,
    },
    {
      accessorKey: "responseTimeHours",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Response Time
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.responseTimeHours ? `${row.original.responseTimeHours} hrs` : "—"}
        </span>
      ),
    },
    {
      accessorKey: "slaStatus",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SLA Status
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const sla = row.original.slaStatus
        if (sla === "on_time") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              On Time
            </Badge>
          )
        }
        if (sla === "warning") {
          return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 text-xs">
              Warning
            </Badge>
          )
        }
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 text-xs">
            Overdue
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const query = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSendNotification(query)}>
                <Bell className="mr-2 h-4 w-4" />
                Send notification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Q&amp;A &amp; Communication Tracker</h1>
          <p className="text-muted-foreground mt-1.5">
            Monitor query volumes, SLA compliance, escalations, and meeting requests across projects.
          </p>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load Q&A data. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MultiSelectFilter
              label="Project"
              options={projects}
              selected={projectFilter}
              onSelectionChange={setProjectFilter}
              placeholder="All Projects"
            />
            <MultiSelectFilter
              label="Municipality"
              options={municipalities}
              selected={municipalityFilter}
              onSelectionChange={setMunicipalityFilter}
              placeholder="All Municipalities"
            />
            <MultiSelectFilter
              label="Lender"
              options={lenders}
              selected={lenderFilter}
              onSelectionChange={setLenderFilter}
              placeholder="All Lenders"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                      </>
                    ) : (
                      dateRange.from.toLocaleDateString()
                    )
                  ) : (
                    <span className="text-muted-foreground">Date Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <MultiSelectFilter
              label="Category"
              options={categories}
              selected={categoryFilter}
              onSelectionChange={setCategoryFilter}
              placeholder="All Categories"
            />
            <Select value={slaStatusFilter} onValueChange={setSlaStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="SLA Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SLA Status</SelectItem>
                <SelectItem value="on_time">On Time</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Queries</p>
            <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
              {summary?.totalQueries ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Open Queries</p>
            <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
              {summary?.openQueries ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Answered Queries</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              {summary?.answeredQueries ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Avg Response Time</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
              {summary?.averageResponseTimeHours
                ? `${summary.averageResponseTimeHours.toFixed(1)} hrs`
                : isLoading
                  ? "…"
                  : "0 hrs"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">SLA Compliance</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              {summary?.slaComplianceRate ? `${summary.slaComplianceRate.toFixed(1)}%` : isLoading ? "…" : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-200">Escalated Queries</p>
            <p className="mt-2 text-2xl font-bold text-rose-950 dark:text-rose-50">
              {summary?.escalatedQueries ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950 dark:to-purple-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Pending Meetings</p>
            <p className="mt-2 text-2xl font-bold text-indigo-950 dark:text-indigo-50">
              {summary?.pendingMeetingRequests ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-6">
        {/* Q&A Data Table without extra outer card */}
        <div>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading queries...</div>
          ) : queries.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No queries found.</div>
          ) : (
            <DataTable<QaRow, any>
              title="Queries"
              description="All queries raised by lenders with SLA and escalation status"
              columns={columns}
              data={queries}
              showToolbar
              showFooter
              enableExport
              exportFilename="qa-tracker.csv"
              globalFilterPlaceholder="Search by project, municipality, lender, question..."
            />
          )}
        </div>

        {/* SLA Analytics + Meetings + Escalations */}
        <div className="space-y-4">
          {/* SLA Monitoring */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  SLA Monitoring
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Queries answered within 7 days</span>
                  </div>
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                    {queriesWithin7Days.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Overdue queries</span>
                  </div>
                  <span className="font-medium text-rose-700 dark:text-rose-300">
                    {overdueQueriesCount}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>Response time trends</span>
                  </div>
                  {responseTimeTrends.length > 0 ? (
                    <div className="h-48">
                      <Chart
                        options={{
                          chart: {
                            type: "line",
                            toolbar: { show: false },
                            zoom: { enabled: false },
                          },
                          stroke: {
                            curve: "smooth",
                            width: 2,
                          },
                          xaxis: {
                            categories: responseTimeTrends.map((t) => t.date),
                            labels: {
                              style: {
                                fontSize: "11px",
                              },
                            },
                          },
                          yaxis: {
                            labels: {
                              formatter: (val) => `${val.toFixed(1)} hrs`,
                              style: {
                                fontSize: "11px",
                              },
                            },
                          },
                          tooltip: {
                            y: {
                              formatter: (val) => `${val.toFixed(1)} hrs`,
                            },
                          },
                          colors: ["#0ea5e9"],
                          grid: {
                            borderColor: "hsl(var(--border))",
                          },
                        } as ApexOptions}
                        series={[
                          {
                            name: "Avg Response Time",
                            data: responseTimeTrends.map((t) => t.avgResponseTime),
                          },
                        ]}
                        type="line"
                        height="100%"
                      />
                    </div>
                  ) : (
                    <div className="h-48 rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center text-[11px] text-muted-foreground">
                      No data available for response time trends
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escalation Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" />
                Escalation Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {escalatedQueries.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No escalated queries.</div>
              ) : (
                <div className="space-y-3">
                  {escalatedQueries.map((eq) => (
                    <div key={eq.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{eq.id}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                eq.resolutionStatus === "resolved" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                eq.resolutionStatus === "in_progress" && "bg-blue-50 text-blue-700 border-blue-200",
                                eq.resolutionStatus === "pending" && "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {eq.resolutionStatus === "resolved"
                                ? "Resolved"
                                : eq.resolutionStatus === "in_progress"
                                  ? "In Progress"
                                  : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium">{eq.project} • {eq.municipality}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{eq.question}</p>
                          {eq.escalationReason && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Reason: {eq.escalationReason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Escalated: {formatDateTime(eq.escalationDate)}
                          </p>
                        </div>
                        {eq.resolutionStatus !== "resolved" && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkResolved(eq)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Requests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-primary" />
                Meeting Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">Loading meetings...</div>
              ) : meetings.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No meeting requests found.</div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{meeting.id}</p>
                            <Badge variant="outline" className="text-xs capitalize whitespace-nowrap">
                              {meeting.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground">{meeting.project}</p>
                          <p className="text-xs text-muted-foreground">
                            {meeting.municipality} • Requested by {meeting.requestedBy}
                          </p>
                          {meeting.scheduledAt && (
                            <p className="text-xs text-muted-foreground">
                              Scheduled: {formatDateTime(meeting.scheduledAt)}
                            </p>
                          )}
                        </div>
                        {meeting.status === "Pending scheduling" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSendReminderToMunicipality(meeting.municipality)}
                            className="shrink-0"
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            Send Reminder
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



