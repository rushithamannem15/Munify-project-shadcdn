import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowUpDown,
  Bell,
  Clock,
  FileText,
  Filter,
  FolderKanban,
  IndianRupee,
  MessageCircle,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { alerts } from "@/lib/alerts"
import type {
  AdminMonitoringMasterDashboardResponse,
  AdminMonitoringProject,
  HealthStatus,
} from "./AdminMonitoringTypes"

const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100",
  at_risk: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100",
  critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100",
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

export default function AdminMasterMonitoringDashboard() {
  const [municipalityFilter, setMunicipalityFilter] = useState<string>("all")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [healthFilter, setHealthFilter] = useState<string>("all")
  const [windowFilter, setWindowFilter] = useState<string>("all")

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
      if (municipalityFilter !== "all" && p.municipality !== municipalityFilter) return false
      if (stageFilter !== "all" && p.stage !== stageFilter) return false
      if (healthFilter !== "all" && p.healthStatus !== healthFilter) return false
      if (windowFilter !== "all" && p.windowStatus !== windowFilter) return false
      return true
    })
  }, [projects, municipalityFilter, stageFilter, healthFilter, windowFilter])

  const handleSendNotification = (project: AdminMonitoringProject) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for project: ${project.projectName}`)
  }

  const columns: ColumnDef<AdminMonitoringProject, any>[] = [
    {
      accessorKey: "projectName",
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
        const project = row.original
        return (
          <div className="min-w-[220px]">
            <div className="font-medium text-foreground">{project.projectName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{project.municipality}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.stage}
        </Badge>
      ),
    },
    {
      accessorKey: "fundingRequirement",
      header: "Funding Requirement",
      cell: ({ row }) => (
        <div className="min-w-[120px] text-sm font-medium text-foreground">
          {formatCurrency(row.original.fundingRequirement)}
        </div>
      ),
    },
    {
      accessorKey: "committedAmount",
      header: "Committed Amount",
      cell: ({ row }) => (
        <div className="min-w-[120px] text-sm font-medium text-foreground">
          {formatCurrency(row.original.committedAmount)}
        </div>
      ),
    },
    {
      accessorKey: "commitmentPercentage",
      header: "Commitment %",
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
      header: "Gap",
      cell: ({ row }) => (
        <div className="min-w-[100px] text-sm text-muted-foreground">
          {formatCurrency(row.original.gapAmount)}
        </div>
      ),
    },
    {
      accessorKey: "windowStatus",
      header: "Window",
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
      header: "Days Remaining",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.daysRemaining ?? "—"}</span>
      ),
    },
    {
      accessorKey: "qaTotalCount",
      header: "Q&A (Open/Total)",
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
      header: "Open Doc Requests",
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
      header: "Allocation",
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
      header: "Health",
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
          <Button variant="outline" size="sm">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Municipality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Municipalities</SelectItem>
                {municipalities.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Project Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Health Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={windowFilter} onValueChange={setWindowFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Window Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Windows</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closing_soon">Closing Soon</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                Loading recent activities...
              </div>
            ) : activities.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No recent activities recorded.
              </div>
            ) : (
              <ScrollArea className="h-[460px] pr-4">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-sky-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                    </div>
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



