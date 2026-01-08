import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  MoreHorizontal,
  Bell,
  Download,
  Filter,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
// import apiService from "@/services/api" // TODO: Uncomment when API endpoint is ready
import { alerts } from "@/lib/alerts"
import { MonitoringScreenHeader } from "@/components/monitoring/MonitoringScreenHeader"

interface AllocationRow {
  project: string
  projectId?: number
  municipality: string
  windowCloseDate: string
  allocationDueDate: string
  allocationStatus: "pending" | "confirmed" | "overdue"
  daysOverdue: number
  totalCommitmentsCount: number
  totalCommitmentsAmount: number
  selectedCommitmentsCount: number
  selectedCommitmentsAmount: number
  rejectedCommitmentsCount: number
  rejectedCommitmentsAmount: number
}

interface DisbursementRow {
  project: string
  projectId?: number
  municipality: string
  lender: string
  acceptedAmount: number
  disbursementStatus: "pending" | "document_uploaded" | "verified"
  documentUploadDate?: string
  disbursementLetterUrl?: string
  verificationStatus: "pending" | "verified" | "rejected"
  successFeeStatus: "not_calculated" | "calculated" | "recorded"
  successFeeAmount?: number
}

interface AllocationDisbursementSummary {
  projectsAwaitingAllocation: number
  allocationConfirmationsOverdue: number
  totalDisbursementsExpected: number
  disbursementsReceived: number
  pendingDisbursements: number
  successFeesCalculated: number
}

interface AllocationDisbursementResponse {
  summary: AllocationDisbursementSummary
  allocations: AllocationRow[]
  disbursements: DisbursementRow[]
}

// Hardcoded dummy data for allocation & disbursement tracker
const MOCK_ALLOCATION_DISBURSEMENT: AllocationDisbursementResponse = {
  summary: {
    projectsAwaitingAllocation: 3,
    allocationConfirmationsOverdue: 1,
    totalDisbursementsExpected: 32_50_00_000,
    disbursementsReceived: 18_75_00_000,
    pendingDisbursements: 13_75_00_000,
    successFeesCalculated: 4,
  },
  allocations: [
    {
      project: "Smart Street Lighting Upgrade",
      projectId: 1,
      municipality: "Pune Municipal Corporation",
      windowCloseDate: "2024-11-30T00:00:00.000Z",
      allocationDueDate: "2024-12-07T00:00:00.000Z",
      allocationStatus: "pending",
      daysOverdue: 0,
      totalCommitmentsCount: 3,
      totalCommitmentsAmount: 12_00_00_000,
      selectedCommitmentsCount: 0,
      selectedCommitmentsAmount: 0,
      rejectedCommitmentsCount: 0,
      rejectedCommitmentsAmount: 0,
    },
    {
      project: "Urban Mobility Bus Fleet Renewal",
      projectId: 2,
      municipality: "Ahmedabad Municipal Corporation",
      windowCloseDate: "2024-10-10T00:00:00.000Z",
      allocationDueDate: "2024-10-17T00:00:00.000Z",
      allocationStatus: "overdue",
      daysOverdue: 3,
      totalCommitmentsCount: 4,
      totalCommitmentsAmount: 16_50_00_000,
      selectedCommitmentsCount: 2,
      selectedCommitmentsAmount: 10_00_00_000,
      rejectedCommitmentsCount: 2,
      rejectedCommitmentsAmount: 6_50_00_000,
    },
    {
      project: "Sewage Treatment Plant Modernization",
      projectId: 3,
      municipality: "Chennai Corporation",
      windowCloseDate: "2024-09-20T00:00:00.000Z",
      allocationDueDate: "2024-09-27T00:00:00.000Z",
      allocationStatus: "confirmed",
      daysOverdue: 0,
      totalCommitmentsCount: 5,
      totalCommitmentsAmount: 20_00_00_000,
      selectedCommitmentsCount: 3,
      selectedCommitmentsAmount: 15_00_00_000,
      rejectedCommitmentsCount: 2,
      rejectedCommitmentsAmount: 5_00_00_000,
    },
  ],
  disbursements: [
    {
      project: "Sewage Treatment Plant Modernization",
      projectId: 3,
      municipality: "Chennai Corporation",
      lender: "ABC Infrastructure Finance Ltd.",
      acceptedAmount: 7_50_00_000,
      disbursementStatus: "verified",
      documentUploadDate: "2024-10-01T00:00:00.000Z",
      disbursementLetterUrl: "/documents/disbursement-letter-001.pdf",
      verificationStatus: "verified",
      successFeeStatus: "recorded",
      successFeeAmount: 22_50_000,
    },
    {
      project: "Urban Mobility Bus Fleet Renewal",
      projectId: 2,
      municipality: "Ahmedabad Municipal Corporation",
      lender: "Urban Mobility Fund",
      acceptedAmount: 6_25_00_000,
      disbursementStatus: "document_uploaded",
      documentUploadDate: "2024-10-14T00:00:00.000Z",
      disbursementLetterUrl: "/documents/disbursement-letter-002.pdf",
      verificationStatus: "pending",
      successFeeStatus: "not_calculated",
      successFeeAmount: undefined,
    },
    {
      project: "Smart Street Lighting Upgrade",
      projectId: 1,
      municipality: "Pune Municipal Corporation",
      lender: "XYZ Green Fund",
      acceptedAmount: 4_00_00_000,
      disbursementStatus: "pending",
      documentUploadDate: undefined,
      disbursementLetterUrl: undefined,
      verificationStatus: "pending",
      successFeeStatus: "not_calculated",
      successFeeAmount: undefined,
    },
  ],
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  return `₹${amount.toLocaleString("en-IN")}`
}

function formatDate(dateString?: string) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
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
              <div
                key={option}
                className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                onClick={() => handleToggle(option)}
              >
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

export default function AllocationDisbursementTracker() {
  const navigate = useNavigate()

  // Filter states for Disbursement Tracking
  const [projectFilter, setProjectFilter] = useState<string[]>([])
  const [municipalityFilter, setMunicipalityFilter] = useState<string[]>([])
  const [lenderFilter, setLenderFilter] = useState<string[]>([])
  const [disbursementStatusFilter, setDisbursementStatusFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<AllocationDisbursementResponse>({
    queryKey: ["admin-monitoring", "allocation-disbursement"],
    queryFn: async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // return await apiService.get<AllocationDisbursementResponse>("/admin/allocation-disbursement-tracker/")
        return MOCK_ALLOCATION_DISBURSEMENT
      } catch (err) {
        // Fallback to mock data if API fails
        console.warn("API call failed, using mock data:", err)
        return MOCK_ALLOCATION_DISBURSEMENT
      }
    },
    refetchInterval: 60000, // Auto-refresh every 60 seconds for detail screens
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleExport = () => {
    alerts.info("Export", "Exporting allocation & disbursement data to Excel")
  }

  const handlePrint = () => {
    window.print()
  }


  // Handler functions
  const handleViewAllocation = (allocation: AllocationRow) => {
    if (allocation.projectId) {
      navigate(`/main/projects/${allocation.projectId}`)
    } else {
      alerts.info("Info", "Project details not available")
    }
  }


  const handleSendNotification = (allocation: AllocationRow) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for allocation: ${allocation.project}`)
  }

  const handleSendNotificationForDisbursement = (disbursement: DisbursementRow) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for disbursement: ${disbursement.project}`)
  }

  const handleViewDisbursement = (disbursement: DisbursementRow) => {
    if (disbursement.projectId) {
      navigate(`/main/projects/${disbursement.projectId}`)
    } else {
      alerts.info("Info", "Project details not available")
    }
  }

  const handleDownloadDisbursementLetter = (disbursement: DisbursementRow) => {
    if (disbursement.disbursementLetterUrl) {
      alerts.info("Download", `Downloading disbursement letter for ${disbursement.project}`)
    } else {
      alerts.error("Error", "Disbursement letter not available")
    }
  }


  const handleResetFilters = () => {
    setProjectFilter([])
    setMunicipalityFilter([])
    setLenderFilter([])
    setDisbursementStatusFilter([])
    setDateRange(undefined)
  }

  const summary = data?.summary
  const allocations: AllocationRow[] = useMemo(
    () => (Array.isArray(data?.allocations) ? data?.allocations : []) || [],
    [data?.allocations],
  )

  // Filter disbursements based on filters
  const disbursements: DisbursementRow[] = useMemo(() => {
    let filtered = (Array.isArray(data?.disbursements) ? data?.disbursements : []) || []

    // Filter by project
    if (projectFilter.length > 0) {
      filtered = filtered.filter((disb) => projectFilter.includes(disb.project))
    }

    // Filter by municipality
    if (municipalityFilter.length > 0) {
      filtered = filtered.filter((disb) => municipalityFilter.includes(disb.municipality))
    }

    // Filter by lender
    if (lenderFilter.length > 0) {
      filtered = filtered.filter((disb) => lenderFilter.includes(disb.lender))
    }

    // Filter by disbursement status
    if (disbursementStatusFilter.length > 0) {
      filtered = filtered.filter((disb) => disbursementStatusFilter.includes(disb.disbursementStatus))
    }

    // Filter by date range (document upload date)
    if (dateRange?.from) {
      filtered = filtered.filter((disb) => {
        if (!disb.documentUploadDate) return false
        const uploadDate = new Date(disb.documentUploadDate)
        const fromDate = dateRange.from
        const toDate = dateRange.to || dateRange.from

        if (!fromDate || !toDate) return false
        return uploadDate >= fromDate && uploadDate <= toDate
      })
    }

    return filtered
  }, [data?.disbursements, projectFilter, municipalityFilter, lenderFilter, disbursementStatusFilter, dateRange])

  // Get unique values for filters
  const uniqueProjects = useMemo(() => {
    const projects = new Set<string>()
    data?.disbursements?.forEach((disb) => projects.add(disb.project))
    return Array.from(projects).sort()
  }, [data?.disbursements])

  const uniqueMunicipalities = useMemo(() => {
    const municipalities = new Set<string>()
    data?.disbursements?.forEach((disb) => municipalities.add(disb.municipality))
    return Array.from(municipalities).sort()
  }, [data?.disbursements])

  const uniqueLenders = useMemo(() => {
    const lenders = new Set<string>()
    data?.disbursements?.forEach((disb) => lenders.add(disb.lender))
    return Array.from(lenders).sort()
  }, [data?.disbursements])

  const disbursementStatusOptions = ["pending", "document_uploaded", "verified"]

  const allocationColumns: ColumnDef<AllocationRow, any>[] = [
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <button
            onClick={() => handleViewAllocation(row.original)}
            className="font-medium text-foreground hover:text-primary hover:underline text-left"
          >
            {row.original.project}
          </button>
          <div className="text-xs text-muted-foreground">{row.original.municipality}</div>
        </div>
      ),
    },
    {
      accessorKey: "windowCloseDate",
      header: "Window Close Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.windowCloseDate)}</span>,
    },
    {
      accessorKey: "allocationDueDate",
      header: "Allocation Due Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.allocationDueDate)}</span>,
    },
    {
      accessorKey: "allocationStatus",
      header: "Allocation Status",
      cell: ({ row }) => {
        const status = row.original.allocationStatus
        if (status === "confirmed") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Confirmed
            </Badge>
          )
        }
        if (status === "overdue") {
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 text-xs">
              Overdue
            </Badge>
          )
        }
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 text-xs">
            Pending
          </Badge>
        )
      },
    },
    {
      accessorKey: "daysOverdue",
      header: "Days Overdue",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.daysOverdue}</span>,
    },
    {
      accessorKey: "totalCommitmentsAmount",
      header: "Total Commitments",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {formatCurrency(row.original.totalCommitmentsAmount)} ({row.original.totalCommitmentsCount})
        </span>
      ),
    },
    {
      accessorKey: "selectedCommitmentsAmount",
      header: "Selected Commitments",
      cell: ({ row }) => (
        <span className="font-medium text-emerald-700 dark:text-emerald-300">
          {formatCurrency(row.original.selectedCommitmentsAmount)} ({row.original.selectedCommitmentsCount})
        </span>
      ),
    },
    {
      accessorKey: "rejectedCommitmentsAmount",
      header: "Rejected Commitments",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatCurrency(row.original.rejectedCommitmentsAmount)} ({row.original.rejectedCommitmentsCount})
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const allocation = row.original
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
              <DropdownMenuItem onClick={() => handleSendNotification(allocation)}>
                <Bell className="mr-2 h-4 w-4" />
                Send notification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const disbursementColumns: ColumnDef<DisbursementRow, any>[] = [
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <button
            onClick={() => handleViewDisbursement(row.original)}
            className="font-medium text-foreground hover:text-primary hover:underline text-left"
          >
            {row.original.project}
          </button>
          <div className="text-xs text-muted-foreground">{row.original.municipality}</div>
        </div>
      ),
    },
    { accessorKey: "lender", header: "Lender" },
    {
      accessorKey: "acceptedAmount",
      header: "Accepted Amount",
      cell: ({ row }) => <span className="font-medium text-foreground">{formatCurrency(row.original.acceptedAmount)}</span>,
    },
    {
      accessorKey: "disbursementStatus",
      header: "Disbursement Status",
      cell: ({ row }) => {
        const status = row.original.disbursementStatus
        if (status === "verified") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Verified
            </Badge>
          )
        }
        if (status === "document_uploaded") {
          return (
            <Badge className="bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-100 text-xs">
              Document Uploaded
            </Badge>
          )
        }
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 text-xs">
            Pending
          </Badge>
        )
      },
    },
    {
      accessorKey: "documentUploadDate",
      header: "Document Upload Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.documentUploadDate)}</span>,
    },
    {
      accessorKey: "disbursementLetterUrl",
      header: "Disbursement Letter",
      cell: ({ row }) => {
        if (row.original.disbursementLetterUrl) {
          return (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => handleDownloadDisbursementLetter(row.original)}
            >
              <Download className="mr-1 h-3 w-3" />
              Download
            </Button>
          )
        }
        return <span className="text-xs text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "verificationStatus",
      header: "Verification",
      cell: ({ row }) => {
        const status = row.original.verificationStatus
        if (status === "verified") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Verified
            </Badge>
          )
        }
        if (status === "rejected") {
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 text-xs">
              Rejected
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
      accessorKey: "successFeeStatus",
      header: "Success Fee",
      cell: ({ row }) => {
        const status = row.original.successFeeStatus
        if (status === "recorded") {
          return (
            <span className="text-xs text-emerald-700 dark:text-emerald-300">
              Recorded {row.original.successFeeAmount ? `(${formatCurrency(row.original.successFeeAmount)})` : ""}
            </span>
          )
        }
        if (status === "calculated") {
          return (
            <span className="text-xs text-sky-700 dark:text-sky-300">
              Calculated {row.original.successFeeAmount ? `(${formatCurrency(row.original.successFeeAmount)})` : ""}
            </span>
          )
        }
        return <span className="text-xs text-muted-foreground">Not calculated</span>
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const disbursement = row.original
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
              <DropdownMenuItem onClick={() => handleSendNotificationForDisbursement(disbursement)}>
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
      <MonitoringScreenHeader
        screenName="Allocation & Disbursement Tracker"
        description="Monitor allocation confirmations, disbursement statuses, and success fee calculation across projects."
        showBackButton
        onExport={handleExport}
        onPrint={handlePrint}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
      />

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load allocation & disbursement data. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Projects Awaiting Allocation</p>
            <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
              {summary?.projectsAwaitingAllocation ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-200">Allocation Overdue</p>
            <p className="mt-2 text-2xl font-bold text-rose-950 dark:text-rose-50">
              {summary?.allocationConfirmationsOverdue ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Total Disbursements Expected</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              {summary ? formatCurrency(summary.totalDisbursementsExpected) : isLoading ? "…" : "₹0"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950 dark:to-purple-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Disbursements Received</p>
            <p className="mt-2 text-2xl font-bold text-indigo-950 dark:text-indigo-50">
              {summary ? formatCurrency(summary.disbursementsReceived) : isLoading ? "…" : "₹0"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Pending Disbursements</p>
            <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
              {summary ? formatCurrency(summary.pendingDisbursements) : isLoading ? "…" : "₹0"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Success Fees Calculated</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
              {summary?.successFeesCalculated ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocations">Allocation Status</TabsTrigger>
          <TabsTrigger value="disbursements">Disbursement Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <div>
            {isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading allocations...</div>
            ) : allocations.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No allocation data found.</div>
            ) : (
                <DataTable<AllocationRow, any>
                  title="Allocations"
                  description="Projects with their allocation due dates, status, and commitment breakdown"
                  columns={allocationColumns}
                  data={allocations}
                  showToolbar
                  showFooter
                  enableExport
                  exportFilename="allocations-tracker.csv"
                  globalFilterPlaceholder="Search by project or municipality..."
                  pageSize={50}
                />
            )}
          </div>
        </TabsContent>

        <TabsContent value="disbursements" className="space-y-4">
          <div className="space-y-4">
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
                    options={uniqueProjects}
                    selected={projectFilter}
                    onSelectionChange={setProjectFilter}
                    placeholder="All Projects"
                  />
                  <MultiSelectFilter
                    label="Municipality"
                    options={uniqueMunicipalities}
                    selected={municipalityFilter}
                    onSelectionChange={setMunicipalityFilter}
                    placeholder="All Municipalities"
                  />
                  <MultiSelectFilter
                    label="Lender"
                    options={uniqueLenders}
                    selected={lenderFilter}
                    onSelectionChange={setLenderFilter}
                    placeholder="All Lenders"
                  />
                  <MultiSelectFilter
                    label="Disbursement Status"
                    options={disbursementStatusOptions}
                    selected={disbursementStatusFilter}
                    onSelectionChange={setDisbursementStatusFilter}
                    placeholder="All Statuses"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
              </CardContent>
            </Card>

            {/* Disbursement Table */}
            {isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading disbursements...</div>
            ) : disbursements.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No disbursement data found.</div>
            ) : (
              <DataTable<DisbursementRow, any>
                title="Disbursements"
                description="Disbursement documents, verification status, and success fee tracking"
                columns={disbursementColumns}
                data={disbursements}
                showToolbar
                showFooter
                enableExport
                exportFilename="disbursements-tracker.csv"
                globalFilterPlaceholder="Search by project, municipality, or lender..."
                pageSize={50}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



