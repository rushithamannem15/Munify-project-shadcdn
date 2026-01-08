import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  ArrowUpDown,
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  FolderKanban,
  IndianRupee,
  MessageCircle,
  MoreHorizontal,
  Send,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"
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
import type {
  AdminMonitoringMasterDashboardResponse,
  AdminMonitoringProject,
  HealthStatus,
  AdminMonitoringActivityType,
} from "../../admin/pages/AdminMonitoringTypes"

const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100",
  at_risk: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100",
  critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100",
}

const ACTIVITY_COLORS: Record<AdminMonitoringActivityType, string> = {
  project_submitted: "bg-blue-500",
  project_approved: "bg-emerald-500",
  project_rejected: "bg-red-500",
  commitment_received: "bg-green-500",
  commitment_window_closed: "bg-amber-500",
  allocation_confirmed: "bg-teal-500",
  qa_response: "bg-sky-500",
  document_uploaded: "bg-purple-500",
  disbursement_uploaded: "bg-indigo-500",
  status_changed: "bg-orange-500",
}

const ACTIVITY_LABELS: Record<AdminMonitoringActivityType, string> = {
  project_submitted: "Project Submitted",
  project_approved: "Project Approved",
  project_rejected: "Project Rejected",
  commitment_received: "Commitment Received",
  commitment_window_closed: "Window Closed",
  allocation_confirmed: "Allocation Confirmed",
  qa_response: "Q&A Response",
  document_uploaded: "Document Uploaded",
  disbursement_uploaded: "Disbursement Uploaded",
  status_changed: "Status Changed",
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Hardcoded dummy data for the master monitoring dashboard
const MOCK_MASTER_DASHBOARD: AdminMonitoringMasterDashboardResponse = {
  kpis: {
    totalActiveProjects: 8,
    totalCommitments: 42_50_00_000,
    pendingAllocations: 3,
    pendingQa: 5,
    pendingDocumentRequests: 4,
    fullyFundedProjects: 2,
    projectsAtRisk: 3,
    totalFundingGap: 18_75_00_000,
  },
  activeProjects: [
    {
      id: 1,
      projectName: "Smart Street Lighting Upgrade",
      municipality: "Pune Municipal Corporation",
      stage: "Commitment Stage",
      fundingRequirement: 15_00_00_000,
      committedAmount: 12_00_00_000,
      commitmentPercentage: 80,
      gapAmount: 3_00_00_000,
      windowStatus: "open",
      daysRemaining: 9,
      qaTotalCount: 12,
      qaOpenCount: 3,
      documentRequestsOpenCount: 2,
      allocationStatus: "pending",
      healthStatus: "healthy",
    },
    {
      id: 2,
      projectName: "Sewage Treatment Plant Modernization",
      municipality: "Chennai Corporation",
      stage: "Funding Completed",
      fundingRequirement: 20_00_00_000,
      committedAmount: 20_50_00_000,
      commitmentPercentage: 103,
      gapAmount: 0,
      windowStatus: "closed",
      daysRemaining: 0,
      qaTotalCount: 18,
      qaOpenCount: 1,
      documentRequestsOpenCount: 0,
      allocationStatus: "confirmed",
      healthStatus: "healthy",
    },
    {
      id: 3,
      projectName: "Urban Mobility Bus Fleet Renewal",
      municipality: "Ahmedabad Municipal Corporation",
      stage: "Commitment Stage",
      fundingRequirement: 30_00_00_000,
      committedAmount: 19_50_00_000,
      commitmentPercentage: 65,
      gapAmount: 10_50_00_000,
      windowStatus: "closing_soon",
      daysRemaining: 3,
      qaTotalCount: 9,
      qaOpenCount: 4,
      documentRequestsOpenCount: 3,
      allocationStatus: "pending",
      healthStatus: "at_risk",
    },
    {
      id: 4,
      projectName: "Water Supply Network Rehabilitation",
      municipality: "Nagpur Municipal Corporation",
      stage: "Implementation",
      fundingRequirement: 10_00_00_000,
      committedAmount: 10_00_00_000,
      commitmentPercentage: 100,
      gapAmount: 0,
      windowStatus: "closed",
      daysRemaining: 0,
      qaTotalCount: 5,
      qaOpenCount: 0,
      documentRequestsOpenCount: 1,
      allocationStatus: "confirmed",
      healthStatus: "healthy",
    },
    {
      id: 5,
      projectName: "Storm Water Drainage Improvement",
      municipality: "Kolkata Municipal Corporation",
      stage: "Commitment Stage",
      fundingRequirement: 18_00_00_000,
      committedAmount: 9_00_00_000,
      commitmentPercentage: 50,
      gapAmount: 9_00_00_000,
      windowStatus: "open",
      daysRemaining: 12,
      qaTotalCount: 7,
      qaOpenCount: 3,
      documentRequestsOpenCount: 2,
      allocationStatus: "pending",
      healthStatus: "critical",
    },
  ],
  recentActivities: [
    {
      id: "a1",
      type: "commitment_received",
      projectName: "Smart Street Lighting Upgrade",
      municipality: "Pune Municipal Corporation",
      occurredAt: new Date().toISOString(),
      description: "₹2 Cr commitment received from ABC Infrastructure Finance Ltd.",
    },
    {
      id: "a2",
      type: "qa_response",
      projectName: "Urban Mobility Bus Fleet Renewal",
      municipality: "Ahmedabad Municipal Corporation",
      occurredAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      description: "Municipality responded to lender query on operational subsidy structure.",
    },
    {
      id: "a3",
      type: "document_uploaded",
      projectName: "Sewage Treatment Plant Modernization",
      municipality: "Chennai Corporation",
      occurredAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      description: "Updated DPR (Version 2.1) uploaded by municipality.",
    },
    {
      id: "a4",
      type: "allocation_confirmed",
      projectName: "Water Supply Network Rehabilitation",
      municipality: "Nagpur Municipal Corporation",
      occurredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      description: "Allocation confirmation submitted for selected commitments.",
    },
    {
      id: "a5",
      type: "status_changed",
      projectName: "Storm Water Drainage Improvement",
      municipality: "Kolkata Municipal Corporation",
      occurredAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      description: "Project health moved to Critical due to undersubscription.",
    },
  ],
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

export default function AdminMasterMonitoringDashboard() {
  const navigate = useNavigate()
  const [municipalityFilter, setMunicipalityFilter] = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<string[]>([])
  const [healthFilter, setHealthFilter] = useState<string[]>([])
  const [windowFilter, setWindowFilter] = useState<string[]>([])
  const [sectorFilter, setSectorFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [fundingRange, setFundingRange] = useState<[number, number]>([0, 100000000])
  const [activityTypeFilter, setActivityTypeFilter] = useState<AdminMonitoringActivityType[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Record<string, boolean>>({})

  const { data, isLoading, error, isError } = useQuery<AdminMonitoringMasterDashboardResponse>({
    queryKey: ["admin-monitoring", "master-dashboard"],
    // Hardcoded dummy data to render the screen without backend
    queryFn: async () => MOCK_MASTER_DASHBOARD,
  })

  const kpis = data?.kpis
  const projects: AdminMonitoringProject[] = useMemo(
    () => (Array.isArray(data?.activeProjects) ? data?.activeProjects : []) || [],
    [data?.activeProjects],
  )
  const activities = useMemo(
    () => (Array.isArray(data?.recentActivities) ? data?.recentActivities : []) || [],
    [data?.recentActivities],
  )

  const municipalities = useMemo(
    () => Array.from(new Set(projects.map((p) => p.municipality))).sort(),
    [projects],
  )

  const stages = useMemo(
    () => Array.from(new Set(projects.map((p) => p.stage))).sort(),
    [projects],
  )

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (municipalityFilter.length > 0 && !municipalityFilter.includes(p.municipality)) return false
      if (stageFilter.length > 0 && !stageFilter.includes(p.stage)) return false
      if (healthFilter.length > 0 && !healthFilter.includes(p.healthStatus)) return false
      if (windowFilter.length > 0 && !windowFilter.includes(p.windowStatus)) return false
      if (p.fundingRequirement < fundingRange[0] || p.fundingRequirement > fundingRange[1]) return false
      // Date range filter would need project creation date or window dates in the data
      return true
    })
  }, [projects, municipalityFilter, stageFilter, healthFilter, windowFilter, fundingRange])

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (activityTypeFilter.length > 0 && !activityTypeFilter.includes(a.type)) return false
      return true
    })
  }, [activities, activityTypeFilter])

  const sectors = useMemo(() => {
    // Placeholder - would come from actual project data
    return ["Infrastructure", "Water Supply", "Transportation", "Energy", "Waste Management"]
  }, [])

  const selectedProjectIds = useMemo(() => {
    return Object.keys(selectedProjects).filter((id) => selectedProjects[id])
  }, [selectedProjects])

  const handleResetFilters = () => {
    setMunicipalityFilter([])
    setStageFilter([])
    setHealthFilter([])
    setWindowFilter([])
    setSectorFilter([])
    setDateRange(undefined)
    setFundingRange([0, 100000000])
    setActivityTypeFilter([])
  }

  const handleBulkSendReminders = () => {
    if (selectedProjectIds.length === 0) {
      alerts.error("No Selection", "Please select at least one project")
      return
    }
    alerts.success("Reminders Sent", `Reminders sent to ${selectedProjectIds.length} project(s)`)
  }

  const handleBulkExport = () => {
    if (selectedProjectIds.length === 0) {
      alerts.error("No Selection", "Please select at least one project")
      return
    }
    alerts.success("Export Started", `Exporting ${selectedProjectIds.length} project(s)`)
  }

  const handleViewProject = (projectId: number) => {
    navigate(`/main/projects/${projectId}`)
  }

  const handleSendNotification = (project: AdminMonitoringProject) => {
    alerts.success("Notification Sent", `Notification sent for ${project.projectName}`)
  }

  const handleViewActivity = (activity: any) => {
    // Navigate to relevant page based on activity type
    if (activity.projectName) {
      // Find project by name and navigate
      const project = projects.find((p) => p.projectName === activity.projectName)
      if (project) {
        navigate(`/main/projects/${project.id}`)
      }
    }
  }

  const columns: ColumnDef<AdminMonitoringProject, any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            const newSelection: Record<string, boolean> = {}
            if (value) {
              filteredProjects.forEach((p) => {
                newSelection[p.id.toString()] = true
              })
            }
            setSelectedProjects(newSelection)
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedProjects[row.original.id.toString()] || false}
          onCheckedChange={(value) => {
            setSelectedProjects((prev) => ({
              ...prev,
              [row.original.id.toString()]: !!value,
            }))
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "projectName",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Project Name
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const project = row.original
        return (
          <button
            onClick={() => handleViewProject(project.id)}
            className="min-w-[220px] text-left hover:underline"
          >
            <div className="font-medium text-foreground text-blue-600 dark:text-blue-400">{project.projectName}</div>
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
      cell: ({ row }) => (
        <div className="min-w-[180px] text-sm text-foreground">{row.original.municipality}</div>
      ),
    },
    {
      accessorKey: "stage",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stage
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.stage}
        </Badge>
      ),
    },
    {
      accessorKey: "fundingRequirement",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Funding Requirement
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[120px] text-sm font-medium text-foreground">
          {formatCurrency(row.original.fundingRequirement)}
        </div>
      ),
    },
    {
      accessorKey: "committedAmount",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Committed Amount
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[120px] text-sm font-medium text-foreground">
          {formatCurrency(row.original.committedAmount)}
        </div>
      ),
    },
    {
      accessorKey: "commitmentPercentage",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Commitment %
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const pct = row.original.commitmentPercentage
        return (
          <div className="min-w-[110px] flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
            <span className="text-xs font-medium text-foreground w-10 text-right">{pct.toFixed(0)}%</span>
          </div>
        )
      },
    },
    {
      accessorKey: "gapAmount",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Gap
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[100px] text-sm text-muted-foreground">
          {formatCurrency(row.original.gapAmount)}
        </div>
      ),
    },
    {
      accessorKey: "windowStatus",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Window Status
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const status = row.original.windowStatus
        if (status === "open") {
          return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100">Open</Badge>
        }
        if (status === "closing_soon") {
          return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100">
              Closing Soon
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="text-xs">
            Closed
          </Badge>
        )
      },
    },
    {
      accessorKey: "daysRemaining",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Days Remaining
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.daysRemaining ?? "—"}</span>
      ),
    },
    {
      accessorKey: "qaTotalCount",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Q&A (Open/Total)
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center gap-1 text-xs">
            <MessageCircle className="h-3 w-3 text-sky-500" />
            <span className="font-semibold text-sky-700 dark:text-sky-300">{p.qaOpenCount}</span>
            <span className="text-muted-foreground">/ {p.qaTotalCount}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "documentRequestsOpenCount",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Open Doc Requests
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs">
          <UploadCloud className="h-3 w-3 text-amber-500" />
          <span className="font-semibold text-amber-700 dark:text-amber-200">
            {row.original.documentRequestsOpenCount}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "allocationStatus",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Allocation Status
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const status = row.original.allocationStatus
        if (status === "confirmed") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100">
              Confirmed
            </Badge>
          )
        }
        if (status === "overdue") {
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100">
              Overdue
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        )
      },
    },
    {
      accessorKey: "healthStatus",
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Health Status
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => {
        const status = row.original.healthStatus
        return (
          <Badge variant="outline" className={`text-xs inline-flex items-center gap-1 ${HEALTH_COLORS[status]}`}>
            {status === "healthy" && <ShieldCheck className="h-3 w-3" />}
            {status === "at_risk" && <AlertTriangle className="h-3 w-3" />}
            {status === "critical" && <ShieldAlert className="h-3 w-3" />}
            <span className="capitalize">
              {status === "at_risk" ? "At Risk" : status === "critical" ? "Critical" : "Healthy"}
            </span>
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original
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
              <DropdownMenuItem onClick={() => handleSendNotification(project)}>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Master Monitoring Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">
            Overview of all projects, commitments, Q&A, document requests, allocations, and disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedProjectIds.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkSendReminders}>
                <Send className="mr-2 h-4 w-4" />
                Send Reminders ({selectedProjectIds.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <FileText className="mr-2 h-4 w-4" />
                Export Data ({selectedProjectIds.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Active Projects</p>
                <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
                  {kpis?.totalActiveProjects ?? (isLoading ? "…" : 0)}
                </p>
              </div>
              <FolderKanban className="h-6 w-6 text-sky-700 dark:text-sky-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Total Commitments</p>
                <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                  {kpis ? formatCurrency(kpis.totalCommitments) : isLoading ? "…" : "₹0"}
                </p>
              </div>
              <IndianRupee className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Pending Allocations</p>
                <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
                  {kpis?.pendingAllocations ?? (isLoading ? "…" : 0)}
                </p>
              </div>
              <Clock className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-slate-100 dark:from-blue-950 dark:to-slate-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Total Funding Gap</p>
                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
                  {kpis ? formatCurrency(kpis.totalFundingGap) : isLoading ? "…" : "₹0"}
                </p>
              </div>
              <FileText className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-800 dark:text-rose-200">Pending Q&A (Beyond SLA)</p>
                <p className="mt-2 text-2xl font-bold text-rose-950 dark:text-rose-50">
                  {kpis?.pendingQa ?? (isLoading ? "…" : 0)}
                </p>
              </div>
              <MessageCircle className="h-6 w-6 text-rose-700 dark:text-rose-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Pending Document Requests</p>
                <p className="mt-2 text-2xl font-bold text-yellow-950 dark:text-yellow-50">
                  {kpis?.pendingDocumentRequests ?? (isLoading ? "…" : 0)}
                </p>
              </div>
              <UploadCloud className="h-6 w-6 text-yellow-700 dark:text-yellow-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Fully Funded Projects</p>
                <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                  {kpis?.fullyFundedProjects ?? (isLoading ? "…" : 0)}
                </p>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-950">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-800 dark:text-red-200">Projects at Risk</p>
                <p className="mt-2 text-2xl font-bold text-red-950 dark:text-red-50">
                  {kpis?.projectsAtRisk ?? (isLoading ? "…" : 0)}
                </p>
              </div>
              <ShieldAlert className="h-6 w-6 text-red-700 dark:text-red-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load monitoring dashboard. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Middle + Bottom layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        {/* Active Projects Table without extra outer card */}
        <div className="col-span-1 space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <MultiSelectFilter
                  label="Municipality"
                  options={municipalities}
                  selected={municipalityFilter}
                  onSelectionChange={setMunicipalityFilter}
                  placeholder="All Municipalities"
                />
                <MultiSelectFilter
                  label="Project Stage"
                  options={stages}
                  selected={stageFilter}
                  onSelectionChange={setStageFilter}
                  placeholder="All Stages"
                />
                <MultiSelectFilter
                  label="Health Status"
                  options={["healthy", "at_risk", "critical"]}
                  selected={healthFilter}
                  onSelectionChange={setHealthFilter}
                  placeholder="All Health"
                />
                <MultiSelectFilter
                  label="Window Status"
                  options={["open", "closing_soon", "closed"]}
                  selected={windowFilter}
                  onSelectionChange={setWindowFilter}
                  placeholder="All Windows"
                />
                <MultiSelectFilter
                  label="Sector/Category"
                  options={sectors}
                  selected={sectorFilter}
                  onSelectionChange={setSectorFilter}
                  placeholder="All Sectors"
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Funding Range</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(fundingRange[0])} - {formatCurrency(fundingRange[1])}
                  </span>
                </div>
                <Slider
                  value={fundingRange}
                  onValueChange={(value) => setFundingRange(value as [number, number])}
                  min={0}
                  max={100000000}
                  step={1000000}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              Loading active projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No active projects found for the selected filters.
            </div>
          ) : (
            <DataTable<AdminMonitoringProject, any>
              title="Active Projects"
              description="Projects currently in commitment, funding, implementation, or closing stages"
              columns={columns}
              data={filteredProjects}
              showToolbar
              showFooter
              enableExport
              exportFilename="admin-active-projects.csv"
              globalFilterPlaceholder="Search projects, municipalities..."
            />
          )}
        </div>

        {/* Recent Activities Timeline */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <div className="p-2">
                    <div className="text-sm font-semibold mb-2 px-2">Activity Type</div>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                      {Object.entries(ACTIVITY_LABELS).map(([type, label]) => (
                        <div
                          key={type}
                          className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                          onClick={() => {
                            if (activityTypeFilter.includes(type as AdminMonitoringActivityType)) {
                              setActivityTypeFilter(activityTypeFilter.filter((t) => t !== type))
                            } else {
                              setActivityTypeFilter([...activityTypeFilter, type as AdminMonitoringActivityType])
                            }
                          }}
                        >
                          <Checkbox checked={activityTypeFilter.includes(type as AdminMonitoringActivityType)} />
                          <span className="text-sm">{label}</span>
                        </div>
                      ))}
                    </div>
                    {activityTypeFilter.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setActivityTypeFilter([])}
                        >
                          Clear all
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                Loading recent activities...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {activityTypeFilter.length > 0
                  ? "No activities found for selected filters."
                  : "No recent activities recorded."}
              </div>
            ) : (
              <ScrollArea className="h-[460px] pr-4">
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => handleViewActivity(activity)}
                      className="w-full text-left flex items-start gap-3 hover:bg-accent/50 rounded-md p-2 -ml-2 transition-colors"
                    >
                      <div className="mt-1">
                        <span
                          className={cn(
                            "inline-block w-2 h-2 rounded-full",
                            ACTIVITY_COLORS[activity.type] || "bg-sky-500"
                          )}
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {ACTIVITY_LABELS[activity.type] || activity.type}
                          </Badge>
                          <span>{formatDateTime(activity.occurredAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        {(activity.projectName || activity.municipality) && (
                          <p className="text-xs text-muted-foreground">
                            {activity.projectName && <span className="font-medium">{activity.projectName}</span>}
                            {activity.projectName && activity.municipality && <span className="mx-1">•</span>}
                            {activity.municipality && <span>{activity.municipality}</span>}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



