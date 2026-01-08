import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Bell,
  Filter,
  Calendar as CalendarIcon,
  ChevronDown,
  MoreHorizontal,
  Send,
  Download,
  CheckCircle,
  Flag,
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import Chart from "react-apexcharts"
import type { ApexOptions } from "apexcharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"
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

interface CommitmentMonitoringRow {
  project: string
  municipality: string
  lender: string
  commitmentDate: string
  amount: number
  rate: number
  tenure: string
  mode: string
  windowStatus: "open" | "closed"
  status: "active" | "modified" | "withdrawn"
  allocationStatus: "pending" | "selected" | "not_selected"
  daysSinceCommitment: number
}

interface CommitmentMonitoringSummary {
  totalActiveCommitments: number
  totalCommitmentValue: number
  averageCommitmentRate: number
  projectsWithCommitments: number
  oversubscribedProjects: number
  undersubscribedProjects: number
}

interface CommitmentMonitoringResponse {
  summary: CommitmentMonitoringSummary
  rows: CommitmentMonitoringRow[]
}

// Hardcoded dummy data for commitment monitoring
const MOCK_COMMITMENTS: CommitmentMonitoringResponse = {
  summary: {
    totalActiveCommitments: 26,
    totalCommitmentValue: 48_25_00_000,
    averageCommitmentRate: 8.9,
    projectsWithCommitments: 7,
    oversubscribedProjects: 2,
    undersubscribedProjects: 3,
  },
  rows: [
    {
      project: "Smart Street Lighting Upgrade",
      municipality: "Pune Municipal Corporation",
      lender: "ABC Infrastructure Finance Ltd.",
      commitmentDate: "2024-10-05T00:00:00.000Z",
      amount: 4_00_00_000,
      rate: 9.25,
      tenure: "10 years",
      mode: "Loan",
      windowStatus: "open",
      status: "active",
      allocationStatus: "pending",
      daysSinceCommitment: 7,
    },
    {
      project: "Sewage Treatment Plant Modernization",
      municipality: "Chennai Corporation",
      lender: "XYZ Green Fund",
      commitmentDate: "2024-09-21T00:00:00.000Z",
      amount: 8_50_00_000,
      rate: 8.6,
      tenure: "12 years",
      mode: "Loan",
      windowStatus: "closed",
      status: "active",
      allocationStatus: "selected",
      daysSinceCommitment: 21,
    },
    {
      project: "Urban Mobility Bus Fleet Renewal",
      municipality: "Ahmedabad Municipal Corporation",
      lender: "Urban Mobility Fund",
      commitmentDate: "2024-10-01T00:00:00.000Z",
      amount: 6_75_00_000,
      rate: 9.1,
      tenure: "8 years",
      mode: "Loan",
      windowStatus: "open",
      status: "modified",
      allocationStatus: "pending",
      daysSinceCommitment: 11,
    },
  ],
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  return `₹${amount.toLocaleString("en-IN")}`
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

// Chart Components
function CommitmentsOverTimeChart({ data }: { data: CommitmentMonitoringRow[] }) {
  // Group commitments by month
  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {}
    data.forEach((row) => {
      const date = new Date(row.commitmentDate)
      const monthKey = `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getFullYear()}`
      grouped[monthKey] = (grouped[monthKey] || 0) + row.amount
    })
    return grouped
  }, [data])

  const chartOptions: ApexOptions = {
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
      categories: Object.keys(monthlyData).sort(),
      labels: {
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => formatCurrency(val),
        style: {
          fontSize: "11px",
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => formatCurrency(val),
      },
    },
    colors: ["#0ea5e9"],
    grid: {
      borderColor: "hsl(var(--border))",
    },
  }

  const chartSeries = [
    {
      name: "Commitment Amount",
      data: Object.keys(monthlyData)
        .sort()
        .map((key) => monthlyData[key]),
    },
  ]

  return (
    <div className="h-48">
      <Chart options={chartOptions} series={chartSeries} type="line" height="100%" />
    </div>
  )
}

function CommitmentsByProjectChart({ data }: { data: CommitmentMonitoringRow[] }) {
  // Group commitments by project
  const projectData = useMemo(() => {
    const grouped: Record<string, number> = {}
    data.forEach((row) => {
      grouped[row.project] = (grouped[row.project] || 0) + row.amount
    })
    return grouped
  }, [data])

  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    xaxis: {
      categories: Object.keys(projectData),
      labels: {
        style: {
          fontSize: "10px",
        },
        rotate: -45,
        rotateAlways: true,
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => formatCurrency(val),
        style: {
          fontSize: "11px",
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => formatCurrency(val),
      },
    },
    colors: ["#10b981"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      },
    },
    grid: {
      borderColor: "hsl(var(--border))",
    },
  }

  const chartSeries = [
    {
      name: "Commitment Amount",
      data: Object.keys(projectData).map((key) => projectData[key]),
    },
  ]

  return (
    <div className="h-48">
      <Chart options={chartOptions} series={chartSeries} type="bar" height="100%" />
    </div>
  )
}

function CommitmentsByLenderChart({ data }: { data: CommitmentMonitoringRow[] }) {
  // Group commitments by lender
  const lenderData = useMemo(() => {
    const grouped: Record<string, number> = {}
    data.forEach((row) => {
      grouped[row.lender] = (grouped[row.lender] || 0) + row.amount
    })
    return grouped
  }, [data])

  const chartOptions: ApexOptions = {
    chart: {
      type: "pie",
      toolbar: { show: false },
    },
    labels: Object.keys(lenderData),
    legend: {
      position: "bottom",
      fontSize: "11px",
    },
    tooltip: {
      y: {
        formatter: (val) => formatCurrency(val),
      },
    },
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
    dataLabels: {
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: "10px",
      },
    },
  }

  const chartSeries = Object.keys(lenderData).map((key) => lenderData[key])

  return (
    <div className="h-48">
      <Chart options={chartOptions} series={chartSeries} type="pie" height="100%" />
    </div>
  )
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

export default function CommitmentMonitoringDashboard() {
  
  // Filter states
  const [projectFilter, setProjectFilter] = useState<string[]>([])
  const [municipalityFilter, setMunicipalityFilter] = useState<string[]>([])
  const [lenderFilter, setLenderFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [allocationStatusFilter, setAllocationStatusFilter] = useState<string>("all")
  const [windowStatusFilter, setWindowStatusFilter] = useState<string>("all")
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 100000000])
  const [rateRange, setRateRange] = useState<[number, number]>([0, 15])
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})

  const { data, isLoading, isError, error } = useQuery<CommitmentMonitoringResponse>({
    queryKey: ["admin-monitoring", "commitments"],
    // Hardcoded dummy data to render the screen without backend
    queryFn: async () => MOCK_COMMITMENTS,
  })

  const summary = data?.summary
  const allRows: CommitmentMonitoringRow[] = useMemo(
    () => (Array.isArray(data?.rows) ? data?.rows : []) || [],
    [data?.rows],
  )

  // Extract unique values for filters
  const projects = useMemo(() => Array.from(new Set(allRows.map((r) => r.project))).sort(), [allRows])
  const municipalities = useMemo(() => Array.from(new Set(allRows.map((r) => r.municipality))).sort(), [allRows])
  const lenders = useMemo(() => Array.from(new Set(allRows.map((r) => r.lender))).sort(), [allRows])

  // Filtered rows
  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (projectFilter.length > 0 && !projectFilter.includes(row.project)) return false
      if (municipalityFilter.length > 0 && !municipalityFilter.includes(row.municipality)) return false
      if (lenderFilter.length > 0 && !lenderFilter.includes(row.lender)) return false
      if (statusFilter !== "all" && row.status !== statusFilter) return false
      if (allocationStatusFilter !== "all" && row.allocationStatus !== allocationStatusFilter) return false
      if (windowStatusFilter !== "all" && row.windowStatus !== windowStatusFilter) return false
      if (row.amount < amountRange[0] || row.amount > amountRange[1]) return false
      if (row.rate < rateRange[0] || row.rate > rateRange[1]) return false
      if (dateRange?.from && new Date(row.commitmentDate) < dateRange.from) return false
      if (dateRange?.to && new Date(row.commitmentDate) > dateRange.to) return false
      return true
    })
  }, [allRows, projectFilter, municipalityFilter, lenderFilter, statusFilter, allocationStatusFilter, windowStatusFilter, amountRange, rateRange, dateRange])

  const selectedRowIds = useMemo(() => {
    return Object.keys(selectedRows).filter((id) => selectedRows[id])
  }, [selectedRows])

  // Calculate average time from commitment to allocation
  const averageTimeToAllocation = useMemo(() => {
    // For commitments with "selected" status, estimate allocation time
    // Using daysSinceCommitment as a proxy for selected items
    const selectedCommitments = allRows.filter((row) => row.allocationStatus === "selected")
    
    if (selectedCommitments.length === 0) {
      // If no selected commitments, use a sample average based on typical business process
      // Typical allocation happens 14-21 days after commitment
      return 18 // days
    }
    
    // Calculate average from selected commitments
    const totalDays = selectedCommitments.reduce((sum, row) => sum + row.daysSinceCommitment, 0)
    return Math.round(totalDays / selectedCommitments.length)
  }, [allRows])

  const handleViewProject = (projectName: string) => {
    // Navigate to project details - would need project ID in real implementation
    alerts.success("View Project", `Viewing details for ${projectName}`)
  }

  const handleSendNotification = (commitment: CommitmentMonitoringRow) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for commitment: ${commitment.project} - ${commitment.lender}`)
  }

  const handleBulkExport = () => {
    if (selectedRowIds.length === 0) {
      alerts.error("No Selection", "Please select at least one commitment")
      return
    }
    alerts.success("Export Started", `Exporting ${selectedRowIds.length} commitment(s) to Excel`)
  }

  const handleBulkSendReminders = () => {
    if (selectedRowIds.length === 0) {
      alerts.error("No Selection", "Please select at least one commitment")
      return
    }
    alerts.success("Reminders Sent", `Reminders sent to ${selectedRowIds.length} lender(s)`)
  }

  const handleBulkFlag = () => {
    if (selectedRowIds.length === 0) {
      alerts.error("No Selection", "Please select at least one commitment")
      return
    }
    alerts.success("Flagged", `${selectedRowIds.length} commitment(s) flagged for review`)
  }

  const handleResetFilters = () => {
    setProjectFilter([])
    setMunicipalityFilter([])
    setLenderFilter([])
    setDateRange(undefined)
    setStatusFilter("all")
    setAllocationStatusFilter("all")
    setWindowStatusFilter("all")
    setAmountRange([0, 100000000])
    setRateRange([0, 15])
  }

  const columns: ColumnDef<CommitmentMonitoringRow, any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            const newSelection: Record<string, boolean> = {}
            if (value) {
              rows.forEach((_, idx) => {
                newSelection[idx.toString()] = true
              })
            }
            setSelectedRows(newSelection)
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows[row.index.toString()] || false}
          onCheckedChange={(value) => {
            setSelectedRows((prev) => ({
              ...prev,
              [row.index.toString()]: !!value,
            }))
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
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
        const item = row.original
        return (
          <button
            onClick={() => handleViewProject(item.project)}
            className="min-w-[220px] text-left hover:underline"
          >
            <div className="font-medium text-foreground text-blue-600 dark:text-blue-400">{item.project}</div>
            <div className="text-xs text-muted-foreground">{item.municipality}</div>
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
      accessorKey: "lender",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Lender
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm">{row.original.lender}</span>,
    },
    {
      accessorKey: "commitmentDate",
      header: "Commitment Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.commitmentDate)}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-medium text-foreground">{formatCurrency(row.original.amount)}</span>,
    },
    { accessorKey: "rate", header: "Rate (%)" },
    { accessorKey: "tenure", header: "Tenure" },
    { accessorKey: "mode", header: "Mode" },
    {
      accessorKey: "windowStatus",
      header: "Window",
      cell: ({ row }) =>
        row.original.windowStatus === "open" ? (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 text-xs">
            Open
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Closed
          </Badge>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "active") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Active
            </Badge>
          )
        }
        if (status === "modified") {
          return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 text-xs">
              Modified
            </Badge>
          )
        }
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 text-xs">
            Withdrawn
          </Badge>
        )
      },
    },
    {
      accessorKey: "allocationStatus",
      header: "Allocation Status",
      cell: ({ row }) => {
        const status = row.original.allocationStatus
        if (status === "selected") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Selected
            </Badge>
          )
        }
        if (status === "pending") {
          return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 text-xs">
              Pending
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="text-xs">
            Not Selected
          </Badge>
        )
      },
    },
    {
      accessorKey: "daysSinceCommitment",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Days Since Commitment
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.daysSinceCommitment}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const commitment = row.original
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
              <DropdownMenuItem onClick={() => handleSendNotification(commitment)}>
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
          <h1 className="text-3xl font-bold tracking-tight">Commitment Monitoring Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">
            Track commitment activity, oversubscription and undersubscription across all projects.
          </p>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load commitment monitoring data. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      {selectedRowIds.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedRowIds.length} commitment(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkSendReminders}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reminders
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkFlag}>
                  <Flag className="mr-2 h-4 w-4" />
                  Flag for Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Active Commitments</p>
            <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
              {summary?.totalActiveCommitments ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Total Commitment Value</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              {summary ? formatCurrency(summary.totalCommitmentValue) : isLoading ? "…" : "₹0"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Average Rate</p>
            <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
              {summary?.averageCommitmentRate ? `${summary.averageCommitmentRate.toFixed(2)}%` : isLoading ? "…" : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Projects with Commitments</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
              {summary?.projectsWithCommitments ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Oversubscribed Projects</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              {summary?.oversubscribedProjects ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-200">Undersubscribed Projects</p>
            <p className="mt-2 text-2xl font-bold text-rose-950 dark:text-rose-50">
              {summary?.undersubscribedProjects ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={allocationStatusFilter} onValueChange={setAllocationStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Allocation Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Allocation Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="not_selected">Not Selected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={windowStatusFilter} onValueChange={setWindowStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Window Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Window Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Amount Range</span>
                <span className="text-muted-foreground">
                  {formatCurrency(amountRange[0])} - {formatCurrency(amountRange[1])}
                </span>
              </div>
              <Slider
                value={amountRange}
                onValueChange={(value) => setAmountRange(value as [number, number])}
                min={0}
                max={100000000}
                step={1000000}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Rate Range (%)</span>
                <span className="text-muted-foreground">
                  {rateRange[0].toFixed(2)}% - {rateRange[1].toFixed(2)}%
                </span>
              </div>
              <Slider
                value={rateRange}
                onValueChange={(value) => setRateRange(value as [number, number])}
                min={0}
                max={15}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table + Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-6">
        <div>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading commitments...</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No commitments found.</div>
          ) : (
            <DataTable<CommitmentMonitoringRow, any>
              title="Commitments"
              description="All commitments across projects, lenders and windows"
              columns={columns}
              data={rows}
              showToolbar
              showFooter
              enableExport
              exportFilename="commitments-monitoring.csv"
              globalFilterPlaceholder="Search by project, municipality, lender..."
            />
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Commitment Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Healthy commitment distribution</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Summary
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Average time from commitment to allocation</span>
              </div>
              <span className="font-medium text-foreground">{averageTimeToAllocation} days</span>
            </div>

            <Tabs defaultValue="overTime" className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overTime" className="text-xs">Over Time</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs">By Project</TabsTrigger>
                <TabsTrigger value="lenders" className="text-xs">By Lender</TabsTrigger>
              </TabsList>
              <TabsContent value="overTime" className="mt-2 space-y-2">
                <CommitmentsOverTimeChart data={rows} />
              </TabsContent>
              <TabsContent value="projects" className="mt-2 space-y-2">
                <CommitmentsByProjectChart data={rows} />
              </TabsContent>
              <TabsContent value="lenders" className="mt-2 space-y-2">
                <CommitmentsByLenderChart data={rows} />
              </TabsContent>
            </Tabs>

            <div className="mt-3 flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Use Export to Excel for deeper offline analysis.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



