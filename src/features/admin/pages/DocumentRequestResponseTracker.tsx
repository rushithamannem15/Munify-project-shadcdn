import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  MoreHorizontal,
  Bell,
  AlertCircle,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import apiService from "@/services/api" // TODO: Uncomment when API endpoint is ready
import { alerts } from "@/lib/alerts"

interface DocumentRequestRow {
  id: string
  project: string
  projectId?: number
  municipality: string
  requestedBy: string
  requestType: string
  requestDate: string
  status: "open" | "fulfilled" | "cancelled"
  responseDate?: string
  fulfillmentTimeHours?: number
  documentsCount: number
}

interface DocumentSummary {
  totalRequests: number
  openRequests: number
  fulfilledRequests: number
  averageFulfillmentTimeHours: number
  documentsUploadedToday: number
  overdueRequests: number
}

interface DocumentTrackerResponse {
  summary: DocumentSummary
  requests: DocumentRequestRow[]
}

// Hardcoded dummy data for document tracker
const MOCK_DOCUMENTS: DocumentTrackerResponse = {
  summary: {
    totalRequests: 14,
    openRequests: 4,
    fulfilledRequests: 9,
    averageFulfillmentTimeHours: 48,
    documentsUploadedToday: 5,
    overdueRequests: 1,
  },
  requests: [
    {
      id: "DR-201",
      project: "Smart Street Lighting Upgrade",
      projectId: 1,
      municipality: "Pune Municipal Corporation",
      requestedBy: "XYZ Green Fund",
      requestType: "Additional Document",
      requestDate: "2024-10-09T00:00:00.000Z",
      status: "fulfilled",
      responseDate: "2024-10-10T00:00:00.000Z",
      fulfillmentTimeHours: 24,
      documentsCount: 2,
    },
    {
      id: "DR-202",
      project: "Urban Mobility Bus Fleet Renewal",
      projectId: 2,
      municipality: "Ahmedabad Municipal Corporation",
      requestedBy: "Urban Mobility Fund",
      requestType: "Meeting",
      requestDate: "2024-10-16T00:00:00.000Z",
      status: "open",
      responseDate: undefined,
      fulfillmentTimeHours: undefined,
      documentsCount: 0,
    },
    {
      id: "DR-203",
      project: "Sewage Treatment Plant Modernization",
      projectId: 3,
      municipality: "Chennai Corporation",
      requestedBy: "ABC Infrastructure Finance Ltd.",
      requestType: "Additional Document",
      requestDate: "2024-10-05T00:00:00.000Z",
      status: "open",
      responseDate: undefined,
      fulfillmentTimeHours: 160,
      documentsCount: 1,
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

export default function DocumentRequestResponseTracker() {
  const navigate = useNavigate()

  const { data, isLoading, isError, error } = useQuery<DocumentTrackerResponse>({
    queryKey: ["admin-monitoring", "documents"],
    queryFn: async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // return await apiService.get<DocumentTrackerResponse>("/admin/document-tracker/")
        return MOCK_DOCUMENTS
      } catch (err) {
        // Fallback to mock data if API fails
        console.warn("API call failed, using mock data:", err)
        return MOCK_DOCUMENTS
      }
    },
  })


  // Handler functions
  const handleViewRequest = (request: DocumentRequestRow) => {
    if (request.projectId) {
      navigate(`/main/projects/${request.projectId}`)
    } else {
      alerts.info("Info", "Project details not available")
    }
  }

  const handleSendNotification = (request: DocumentRequestRow) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for document request ${request.id}`)
  }


  const summary = data?.summary
  const requests: DocumentRequestRow[] = useMemo(
    () => (Array.isArray(data?.requests) ? data?.requests : []) || [],
    [data?.requests],
  )

  const requestColumns: ColumnDef<DocumentRequestRow, any>[] = [
    { accessorKey: "id", header: "Request ID" },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <button
            onClick={() => handleViewRequest(row.original)}
            className="font-medium text-foreground hover:text-primary hover:underline text-left"
          >
            {row.original.project}
          </button>
          <div className="text-xs text-muted-foreground">{row.original.municipality}</div>
        </div>
      ),
    },
    { accessorKey: "requestedBy", header: "Requested By" },
    { accessorKey: "requestType", header: "Type" },
    {
      accessorKey: "requestDate",
      header: "Request Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateTime(row.original.requestDate)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "open") {
          return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 text-xs">
              Open
            </Badge>
          )
        }
        if (status === "fulfilled") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Fulfilled
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="text-xs">
            Cancelled
          </Badge>
        )
      },
    },
    {
      accessorKey: "responseDate",
      header: "Response Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateTime(row.original.responseDate)}</span>,
    },
    {
      accessorKey: "fulfillmentTimeHours",
      header: "Fulfillment Time",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.fulfillmentTimeHours ? `${row.original.fulfillmentTimeHours} hrs` : "—"}
        </span>
      ),
    },
    {
      accessorKey: "documentsCount",
      header: "Documents",
      cell: ({ row }) => <span className="text-xs">{row.original.documentsCount}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const request = row.original
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
              <DropdownMenuItem onClick={() => handleSendNotification(request)}>
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
          <h1 className="text-3xl font-bold tracking-tight">Document Request &amp; Response Tracker</h1>
          <p className="text-muted-foreground mt-1.5">
            Track document requests, fulfillment SLAs, and the central document library.
          </p>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load document tracker data. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Requests</p>
            <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
              {summary?.totalRequests ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Open Requests</p>
            <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
              {summary?.openRequests ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Fulfilled Requests</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              {summary?.fulfilledRequests ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Avg Fulfillment Time</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
              {summary?.averageFulfillmentTimeHours
                ? `${summary.averageFulfillmentTimeHours.toFixed(1)} hrs`
                : isLoading
                  ? "…"
                  : "0 hrs"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-950">
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-200">Overdue Requests</p>
            <p className="mt-2 text-2xl font-bold text-rose-950 dark:text-rose-50">
              {summary?.overdueRequests ?? (isLoading ? "…" : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Requests */}
      <div>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading document requests...</div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No document requests found.</div>
        ) : (
          <DataTable<DocumentRequestRow, any>
            title="Document Requests"
            description="Requests raised by lenders for additional documents or meetings"
            columns={requestColumns}
            data={requests}
            showToolbar
            showFooter
            enableExport
            exportFilename="document-requests.csv"
            globalFilterPlaceholder="Search by project, municipality, lender..."
          />
        )}
      </div>
    </div>
  )
}



