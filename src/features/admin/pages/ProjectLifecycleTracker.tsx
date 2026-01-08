import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ScrollText,
  Activity,
  Bell,
  Download,
  Send,
  Calendar as CalendarIcon,
  MoreHorizontal,
  CheckCircle,
  PlayCircle,
  Filter,
  Calculator,
  ShieldCheck,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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

interface LifecycleProjectSummary {
  id: number
  projectId: string
  projectName: string
  municipality: string
  currentStage: string
  healthStatus: "healthy" | "at_risk" | "critical"
  totalProjectCost: number
  fundingRequirement: number
  committedAmount: number
  acceptedAmount: number
  fundingGap: number
  commitmentPercentage: number
  acceptancePercentage: number
  projectStartDate?: string
  projectEndDate?: string
  fundingStartDate?: string
  fundingEndDate?: string
  commitmentWindowOpenDate?: string
  commitmentWindowCloseDate?: string
  allocationConfirmationDate?: string
  disbursementDate?: string
  documentReady: boolean
  commitmentWindowStatus: string
  allocationStatus: string
  disbursementStatus: string
}

interface LifecycleCommitment {
  id: number
  lender: string
  commitmentDate: string
  amount: number
  rate: number
  tenure: string
  mode: string
  conditions?: string
  status: string
}

interface LifecycleQuery {
  id: string
  askedBy: string
  question: string
  category: string
  askedDate: string
  status: string
  responseDate?: string
  responseTimeHours?: number
  slaStatus: string
}

interface LifecycleDocumentRequest {
  id: string
  requestedBy: string
  requestType: string
  requestDate: string
  status: string
  responseDate?: string
  documentsUploadedCount: number
  fulfillmentTimeHours?: number
}

interface LifecycleAllocationRow {
  id: string
  lender: string
  committedAmount: number
  committedRate: number
  allocationStatus: string
  allocationDate?: string
  acceptedAmount?: number
  acceptedRate?: number
  municipalityNotes?: string
}

interface LifecycleDisbursementRow {
  id: string
  lender: string
  acceptedAmount: number
  disbursementStatus: string
  documentUploadDate?: string
  verificationStatus: string
  successFeeCalculated: boolean
  successFeeAmount?: number
  disbursementLetterUrl?: string
}

interface LifecycleMeetingRequest {
  id: string
  requestedBy: string
  requestDate: string
  scheduledDate?: string
  status: "Pending" | "Scheduled" | "Completed" | "Cancelled"
  meetingType: string
  recordingUrl?: string
}

interface LifecycleDocument {
  id: string
  name: string
  type: string
  uploadedBy: string
  uploadDate: string
  downloadUrl: string
}

interface LifecycleStage {
  name: string
  status: "Completed" | "In Progress" | "Pending"
  date?: string
  duration?: string
  nextAction?: string
}

interface ProjectLifecycleTrackerResponse {
  projects: LifecycleProjectSummary[]
  commitments: LifecycleCommitment[]
  queries: LifecycleQuery[]
  documentRequests: LifecycleDocumentRequest[]
  allocations: LifecycleAllocationRow[]
  disbursements: LifecycleDisbursementRow[]
  meetingRequests?: LifecycleMeetingRequest[]
  documents?: LifecycleDocument[]
  stages?: LifecycleStage[]
  actionItems?: Array<{
    id: string
    title: string
    priority: "High" | "Medium" | "Low"
    dueDate?: string
    status: "Pending" | "In Progress" | "Completed"
  }>
  alerts?: Array<{
    id: string
    type: "critical" | "warning" | "info"
    message: string
    timestamp: string
  }>
}

// Hardcoded dummy data for lifecycle tracker
const MOCK_LIFECYCLE: ProjectLifecycleTrackerResponse = {
  projects: [
    {
      id: 1,
      projectId: "PUN-STR-001",
      projectName: "Smart Street Lighting Upgrade",
      municipality: "Pune Municipal Corporation",
      currentStage: "Commitment Window",
      healthStatus: "healthy",
      totalProjectCost: 15_00_00_000,
      fundingRequirement: 12_00_00_000,
      committedAmount: 9_60_00_000,
      acceptedAmount: 0,
      fundingGap: 2_40_00_000,
      commitmentPercentage: 80,
      acceptancePercentage: 0,
      projectStartDate: "2024-06-01T00:00:00.000Z",
      projectEndDate: "2027-03-31T00:00:00.000Z",
      fundingStartDate: "2024-09-01T00:00:00.000Z",
      fundingEndDate: "2024-12-31T00:00:00.000Z",
      commitmentWindowOpenDate: "2024-09-10T00:00:00.000Z",
      commitmentWindowCloseDate: "2024-11-30T00:00:00.000Z",
      allocationConfirmationDate: undefined,
      disbursementDate: undefined,
      documentReady: true,
      commitmentWindowStatus: "Open",
      allocationStatus: "Pending",
      disbursementStatus: "Not Started",
    },
  ],
  commitments: [
    {
      id: 1,
      lender: "ABC Infrastructure Finance Ltd.",
      commitmentDate: "2024-10-05T00:00:00.000Z",
      amount: 4_00_00_000,
      rate: 9.25,
      tenure: "10 years",
      mode: "Loan",
      conditions: "Subject to state guarantee confirmation",
      status: "Active",
    },
    {
      id: 2,
      lender: "XYZ Green Fund",
      commitmentDate: "2024-10-12T00:00:00.000Z",
      amount: 5_60_00_000,
      rate: 8.75,
      tenure: "12 years",
      mode: "Loan",
      conditions: "Minimum DSCR covenant 1.2x",
      status: "Active",
    },
  ],
  queries: [
    {
      id: "Q-101",
      askedBy: "XYZ Green Fund",
      question: "Please share the detailed O&M cost assumptions used in the DPR.",
      category: "Financial",
      askedDate: "2024-10-08T00:00:00.000Z",
      status: "Answered",
      responseDate: "2024-10-11T00:00:00.000Z",
      responseTimeHours: 72,
      slaStatus: "On Time",
    },
    {
      id: "Q-102",
      askedBy: "ABC Infrastructure Finance Ltd.",
      question: "Clarify the energy saving baseline used for performance guarantees.",
      category: "Compliance",
      askedDate: "2024-10-15T00:00:00.000Z",
      status: "Open",
      responseDate: undefined,
      responseTimeHours: undefined,
      slaStatus: "Warning",
    },
  ],
  documentRequests: [
    {
      id: "DR-201",
      requestedBy: "XYZ Green Fund",
      requestType: "Additional Document",
      requestDate: "2024-10-09T00:00:00.000Z",
      status: "Fulfilled",
      responseDate: "2024-10-10T00:00:00.000Z",
      documentsUploadedCount: 2,
      fulfillmentTimeHours: 24,
    },
    {
      id: "DR-202",
      requestedBy: "ABC Infrastructure Finance Ltd.",
      requestType: "Meeting",
      requestDate: "2024-10-16T00:00:00.000Z",
      status: "Open",
      responseDate: undefined,
      documentsUploadedCount: 0,
      fulfillmentTimeHours: undefined,
    },
  ],
  allocations: [
    {
      id: "AL-301",
      lender: "XYZ Green Fund",
      committedAmount: 5_60_00_000,
      committedRate: 8.75,
      allocationStatus: "Pending",
      allocationDate: undefined,
      acceptedAmount: undefined,
      acceptedRate: undefined,
      municipalityNotes: undefined,
    },
  ],
  disbursements: [
    {
      id: "DS-401",
      lender: "ABC Infrastructure Finance Ltd.",
      acceptedAmount: 4_00_00_000,
      disbursementStatus: "Pending",
      documentUploadDate: undefined,
      verificationStatus: "Pending",
      successFeeCalculated: false,
      successFeeAmount: undefined,
      disbursementLetterUrl: undefined,
    },
  ],
  meetingRequests: [
    {
      id: "MR-001",
      requestedBy: "XYZ Green Fund",
      requestDate: "2024-10-10T00:00:00.000Z",
      scheduledDate: "2024-10-20T14:00:00.000Z",
      status: "Scheduled",
      meetingType: "Technical Discussion",
    },
    {
      id: "MR-002",
      requestedBy: "ABC Infrastructure Finance Ltd.",
      requestDate: "2024-10-15T00:00:00.000Z",
      status: "Pending",
      meetingType: "Financial Review",
    },
  ],
  documents: [
    {
      id: "DOC-001",
      name: "Detailed Project Report v2.1",
      type: "DPR",
      uploadedBy: "Pune Municipal Corporation",
      uploadDate: "2024-09-15T00:00:00.000Z",
      downloadUrl: "#",
    },
    {
      id: "DOC-002",
      name: "Financial Projections",
      type: "Financial",
      uploadedBy: "Pune Municipal Corporation",
      uploadDate: "2024-09-20T00:00:00.000Z",
      downloadUrl: "#",
    },
  ],
  stages: [
    { name: "Project Submitted", status: "Completed", date: "2024-06-01", duration: "3 days", nextAction: undefined },
    { name: "Admin Review", status: "Completed", date: "2024-06-15", duration: "14 days", nextAction: undefined },
    { name: "Published", status: "Completed", date: "2024-08-01", duration: "47 days", nextAction: undefined },
    { name: "Commitment Window", status: "In Progress", date: "2024-09-10", duration: "81 days", nextAction: "Monitor commitments" },
    { name: "Allocation", status: "Pending", nextAction: "Wait for window closure" },
    { name: "Disbursement", status: "Pending", nextAction: "Wait for allocation" },
    { name: "Implementation", status: "Pending", nextAction: "Wait for disbursement" },
  ],
  actionItems: [
    { id: "AI-001", title: "Review pending Q&A responses", priority: "High", dueDate: "2024-10-18", status: "Pending" },
    { id: "AI-002", title: "Verify document uploads", priority: "Medium", dueDate: "2024-10-20", status: "In Progress" },
    { id: "AI-003", title: "Schedule allocation meeting", priority: "Low", dueDate: "2024-10-25", status: "Pending" },
  ],
  alerts: [
    { id: "AL-001", type: "warning", message: "Q&A response overdue for Q-102", timestamp: "2024-10-16T10:00:00.000Z" },
    { id: "AL-002", type: "info", message: "New commitment received from XYZ Green Fund", timestamp: "2024-10-12T14:30:00.000Z" },
    { id: "AL-003", type: "critical", message: "Document request DR-202 pending for 3 days", timestamp: "2024-10-19T09:00:00.000Z" },
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

export default function ProjectLifecycleTracker() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | "">("")
  
  // Filter states
  const [commitmentStatusFilter, setCommitmentStatusFilter] = useState<string>("all")
  const [commitmentDateRange, setCommitmentDateRange] = useState<DateRange | undefined>(undefined)
  const [commitmentAmountRange, setCommitmentAmountRange] = useState<[number, number]>([0, 100000000])
  
  const [qaStatusFilter, setQaStatusFilter] = useState<string>("all")
  const [qaCategoryFilter, setQaCategoryFilter] = useState<string>("all")
  const [qaSlaFilter, setQaSlaFilter] = useState<string>("all")
  const [qaDateRange, setQaDateRange] = useState<DateRange | undefined>(undefined)
  
  const [docStatusFilter, setDocStatusFilter] = useState<string>("all")
  const [docDateRange, setDocDateRange] = useState<DateRange | undefined>(undefined)

  const { data, isLoading, error, isError } = useQuery<ProjectLifecycleTrackerResponse>({
    queryKey: ["admin-monitoring", "lifecycle-tracker"],
    // Hardcoded dummy data to render the screen without backend
    queryFn: async () => MOCK_LIFECYCLE,
  })

  const projects = data?.projects ?? []

  const selectedProject = useMemo(
    () => projects.find((p) => p.projectId === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  )

  const allCommitments = (data?.commitments ?? []).filter((c) => !!c.id)
  const allQueries = (data?.queries ?? []).filter((q) => !!q.id)
  const allDocumentRequests = (data?.documentRequests ?? []).filter((d) => !!d.id)
  const allocations = (data?.allocations ?? []).filter((a) => !!a.id)
  const disbursements = (data?.disbursements ?? []).filter((d) => !!d.id)
  const meetingRequests = data?.meetingRequests ?? []
  const documents = data?.documents ?? []
  const stages = data?.stages ?? []
  const actionItems = data?.actionItems ?? []
  const projectAlerts = data?.alerts ?? []

  // Filtered data
  const commitments = useMemo(() => {
    return allCommitments.filter((c) => {
      if (commitmentStatusFilter !== "all" && c.status.toLowerCase() !== commitmentStatusFilter.toLowerCase()) return false
      if (c.amount < commitmentAmountRange[0] || c.amount > commitmentAmountRange[1]) return false
      return true
    })
  }, [allCommitments, commitmentStatusFilter, commitmentAmountRange])

  const queries = useMemo(() => {
    return allQueries.filter((q) => {
      if (qaStatusFilter !== "all" && q.status.toLowerCase() !== qaStatusFilter.toLowerCase()) return false
      if (qaCategoryFilter !== "all" && q.category !== qaCategoryFilter) return false
      if (qaSlaFilter !== "all" && q.slaStatus.toLowerCase() !== qaSlaFilter.toLowerCase()) return false
      return true
    })
  }, [allQueries, qaStatusFilter, qaCategoryFilter, qaSlaFilter])

  const documentRequests = useMemo(() => {
    return allDocumentRequests.filter((d) => {
      if (docStatusFilter !== "all" && d.status.toLowerCase() !== docStatusFilter.toLowerCase()) return false
      return true
    })
  }, [allDocumentRequests, docStatusFilter])

  // Summary calculations
  const commitmentSummary = useMemo(() => {
    const total = commitments.length
    const lenders = new Set(commitments.map((c) => c.lender)).size
    const avgRate = commitments.length > 0
      ? commitments.reduce((sum, c) => sum + c.rate, 0) / commitments.length
      : 0
    const totalAmount = commitments.reduce((sum, c) => sum + c.amount, 0)
    return { total, lenders, avgRate, totalAmount }
  }, [commitments])

  const qaSummary = useMemo(() => {
    const total = allQueries.length
    const open = allQueries.filter((q) => q.status.toLowerCase() === "open").length
    const answered = allQueries.filter((q) => q.status.toLowerCase() === "answered").length
    const avgResponseTime = allQueries
      .filter((q) => q.responseTimeHours !== undefined)
      .reduce((sum, q, _, arr) => sum + (q.responseTimeHours || 0) / arr.length, 0)
    const slaCompliant = allQueries.filter((q) => q.slaStatus.toLowerCase() === "on time").length
    const slaCompliancePercent = total > 0 ? (slaCompliant / total) * 100 : 0
    return { total, open, answered, avgResponseTime, slaCompliancePercent }
  }, [allQueries])

  const docSummary = useMemo(() => {
    const total = allDocumentRequests.length
    const open = allDocumentRequests.filter((d) => d.status.toLowerCase() === "open").length
    const fulfilled = allDocumentRequests.filter((d) => d.status.toLowerCase() === "fulfilled").length
    const avgFulfillmentTime = allDocumentRequests
      .filter((d) => d.fulfillmentTimeHours !== undefined)
      .reduce((sum, d, _, arr) => sum + (d.fulfillmentTimeHours || 0) / arr.length, 0)
    return { total, open, fulfilled, avgFulfillmentTime }
  }, [allDocumentRequests])

  const allocationSummary = useMemo(() => {
    const selected = allocations.filter((a) => a.allocationStatus.toLowerCase() === "selected").length
    const rejected = allocations.filter((a) => a.allocationStatus.toLowerCase() === "not selected").length
    const pending = allocations.filter((a) => a.allocationStatus.toLowerCase() === "pending").length
    const windowCloseDate = selectedProject?.commitmentWindowCloseDate
    const daysSince = windowCloseDate
      ? Math.floor((Date.now() - new Date(windowCloseDate).getTime()) / (1000 * 60 * 60 * 24))
      : undefined
    return { selected, rejected, pending, daysSince, windowCloseDate }
  }, [allocations, selectedProject])

  const disbursementSummary = useMemo(() => {
    const totalExpected = disbursements.reduce((sum, d) => sum + d.acceptedAmount, 0)
    const received = disbursements.filter((d) => d.disbursementStatus.toLowerCase() === "verified").length
    const pending = disbursements.filter((d) => d.disbursementStatus.toLowerCase() === "pending").length
    const successFeeCalculated = disbursements.filter((d) => d.successFeeCalculated).length
    return { totalExpected, received, pending, successFeeCalculated }
  }, [disbursements])

  const handleSendNotification = (commitment: LifecycleCommitment) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for commitment from ${commitment.lender}`)
  }

  const handleSendNotificationForQuery = (query: LifecycleQuery) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for query ${query.id}`)
  }

  const handleSendNotificationForDocument = (doc: LifecycleDocumentRequest) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for document request ${doc.id}`)
  }

  const handleSendNotificationForAllocation = (allocation: LifecycleAllocationRow) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for allocation from ${allocation.lender}`)
  }

  const handleSendNotificationForDisbursement = (disbursement: LifecycleDisbursementRow) => {
    // TODO: Implement API call to send notification
    alerts.success("Success", `Notification sent for disbursement`)
  }


  const commitmentsColumns: ColumnDef<LifecycleCommitment, any>[] = [
    { accessorKey: "lender", header: "Lender" },
    {
      accessorKey: "commitmentDate",
      header: "Commitment Date",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.commitmentDate)}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-medium text-foreground">{formatCurrency(row.original.amount)}</span>,
    },
    { accessorKey: "rate", header: "Rate (%)" },
    { accessorKey: "tenure", header: "Tenure" },
    { accessorKey: "mode", header: "Mode" },
    { accessorKey: "conditions", header: "Conditions" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.status}
        </Badge>
      ),
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

  const queriesColumns: ColumnDef<LifecycleQuery, any>[] = [
    { accessorKey: "id", header: "Query ID" },
    { accessorKey: "askedBy", header: "Asked By" },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "question",
      header: "Question",
      cell: ({ row }) => (
        <span className="line-clamp-2 text-sm text-foreground">{row.original.question}</span>
      ),
    },
    {
      accessorKey: "askedDate",
      header: "Asked Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.askedDate)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "responseDate",
      header: "Response Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.responseDate)}</span>,
    },
    {
      accessorKey: "responseTimeHours",
      header: "Response Time",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.responseTimeHours ? `${row.original.responseTimeHours} hrs` : "—"}
        </span>
      ),
    },
    {
      accessorKey: "slaStatus",
      header: "SLA Status",
      cell: ({ row }) => {
        const sla = row.original.slaStatus.toLowerCase()
        if (sla === "overdue") {
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 text-xs">
              Overdue
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
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
            On Time
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
              <DropdownMenuItem onClick={() => handleSendNotificationForQuery(query)}>
                <Bell className="mr-2 h-4 w-4" />
                Send notification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const documentColumns: ColumnDef<LifecycleDocumentRequest, any>[] = [
    { accessorKey: "id", header: "Request ID" },
    { accessorKey: "requestedBy", header: "Requested By" },
    { accessorKey: "requestType", header: "Type" },
    {
      accessorKey: "requestDate",
      header: "Request Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.requestDate)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "responseDate",
      header: "Response Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.responseDate)}</span>,
    },
    {
      accessorKey: "documentsUploadedCount",
      header: "Documents Uploaded",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs">{row.original.documentsUploadedCount}</span>
        </div>
      ),
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
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const doc = row.original
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
              <DropdownMenuItem onClick={() => handleSendNotificationForDocument(doc)}>
                <Bell className="mr-2 h-4 w-4" />
                Send notification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const allocationColumns: ColumnDef<LifecycleAllocationRow, any>[] = [
    { accessorKey: "lender", header: "Lender" },
    {
      accessorKey: "committedAmount",
      header: "Committed Amount",
      cell: ({ row }) => <span className="font-medium text-foreground">{formatCurrency(row.original.committedAmount)}</span>,
    },
    { accessorKey: "committedRate", header: "Committed Rate (%)" },
    {
      accessorKey: "allocationStatus",
      header: "Allocation Status",
      cell: ({ row }) => {
        const status = row.original.allocationStatus.toLowerCase()
        if (status === "selected") {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 text-xs">
              Selected
            </Badge>
          )
        }
        if (status === "not selected") {
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 text-xs">
              Not Selected
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="text-xs capitalize">
            {row.original.allocationStatus}
          </Badge>
        )
      },
    },
    {
      accessorKey: "allocationDate",
      header: "Allocation Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.allocationDate)}</span>,
    },
    {
      accessorKey: "acceptedAmount",
      header: "Accepted Amount",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.acceptedAmount ? formatCurrency(row.original.acceptedAmount) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "acceptedRate",
      header: "Accepted Rate (%)",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.acceptedRate ? `${row.original.acceptedRate}%` : "—"}</span>
      ),
    },
    {
      accessorKey: "municipalityNotes",
      header: "Municipality Notes",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground line-clamp-2">
          {row.original.municipalityNotes || "—"}
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
              <DropdownMenuItem onClick={() => handleSendNotificationForAllocation(allocation)}>
                <Bell className="mr-2 h-4 w-4" />
                Send notification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const disbursementColumns: ColumnDef<LifecycleDisbursementRow, any>[] = [
    { accessorKey: "lender", header: "Lender" },
    {
      accessorKey: "acceptedAmount",
      header: "Accepted Amount",
      cell: ({ row }) => <span className="font-medium text-foreground">{formatCurrency(row.original.acceptedAmount)}</span>,
    },
    {
      accessorKey: "disbursementStatus",
      header: "Disbursement Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.disbursementStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "documentUploadDate",
      header: "Document Upload Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.documentUploadDate)}</span>,
    },
    {
      accessorKey: "disbursementLetterUrl",
      header: "Disbursement Letter",
      cell: ({ row }) =>
        row.original.disbursementLetterUrl ? (
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <a href={row.original.disbursementLetterUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-1 h-3 w-3" />
              Download
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "verificationStatus",
      header: "Verification Status",
      cell: ({ row }) => {
        const status = row.original.verificationStatus.toLowerCase()
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
          <Badge variant="outline" className="text-xs capitalize">
            {row.original.verificationStatus}
          </Badge>
        )
      },
    },
    {
      accessorKey: "successFeeCalculated",
      header: "Success Fee",
      cell: ({ row }) =>
        row.original.successFeeCalculated ? (
          <span className="text-xs text-emerald-700 dark:text-emerald-300">
            {row.original.successFeeAmount ? formatCurrency(row.original.successFeeAmount) : "Calculated"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not calculated</span>
        ),
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

  const healthBadge =
    selectedProject &&
    (() => {
      if (selectedProject.healthStatus === "healthy") {
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Healthy
          </Badge>
        )
      }
      if (selectedProject.healthStatus === "at_risk") {
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-100 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            At Risk
          </Badge>
        )
      }
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 inline-flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Critical
        </Badge>
      )
    })()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Lifecycle Tracker</h1>
          <p className="text-muted-foreground mt-1.5">
            End-to-end view of a project's commitments, Q&A, documents, allocations, and disbursements.
          </p>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load project lifecycle data. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)] gap-6">
        {/* Left - Project Info & Timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Project Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedProject?.projectId ?? ""}
                onValueChange={(value) => setSelectedProjectId(value)}
                disabled={isLoading || projects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading projects..." : "Select a project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.projectId} value={p.projectId}>
                      {p.projectName} – {p.projectId} – {p.municipality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading project details...</div>
              ) : !selectedProject ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No project data available.</div>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {selectedProject.projectId} • {selectedProject.municipality}
                        </p>
                        <h2 className="text-xl font-semibold text-foreground mt-1">{selectedProject.projectName}</h2>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {selectedProject.currentStage}
                        </Badge>
                        {healthBadge}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-muted-foreground">Financial Summary</p>
                      <div className="space-y-0.5">
                        <p>
                          Total Cost:{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(selectedProject.totalProjectCost)}
                          </span>
                        </p>
                        <p>
                          Requirement:{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(selectedProject.fundingRequirement)}
                          </span>
                        </p>
                        <p>
                          Committed:{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(selectedProject.committedAmount)} (
                            {selectedProject.commitmentPercentage.toFixed(0)}%)
                          </span>
                        </p>
                        <p>
                          Accepted:{" "}
                          <span className="font-medium text-foreground">
                            {formatCurrency(selectedProject.acceptedAmount)} (
                            {selectedProject.acceptancePercentage.toFixed(0)}%)
                          </span>
                        </p>
                        <p>
                          Gap:{" "}
                          <span className="font-medium text-rose-600 dark:text-rose-300">
                            {formatCurrency(selectedProject.fundingGap)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-muted-foreground">Status Indicators</p>
                      <div className="space-y-0.5">
                        <p>
                          Document Readiness:{" "}
                          <span className="font-medium">
                            {selectedProject.documentReady ? "✓ Ready" : "✗ Pending"}
                          </span>
                        </p>
                        <p>
                          Commitment Window:{" "}
                          <span className="font-medium">{selectedProject.commitmentWindowStatus}</span>
                        </p>
                        <p>
                          Allocation: <span className="font-medium">{selectedProject.allocationStatus}</span>
                        </p>
                        <p>
                          Disbursement: <span className="font-medium">{selectedProject.disbursementStatus}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Timeline</p>
                    <div className="space-y-1 text-xs">
                      <p>
                        Project: {formatDate(selectedProject.projectStartDate)} –{" "}
                        {formatDate(selectedProject.projectEndDate)}
                      </p>
                      <p>
                        Funding: {formatDate(selectedProject.fundingStartDate)} –{" "}
                        {formatDate(selectedProject.fundingEndDate)}
                      </p>
                      <p>
                        Commitment Window: {formatDate(selectedProject.commitmentWindowOpenDate)} –{" "}
                        {formatDate(selectedProject.commitmentWindowCloseDate)}
                      </p>
                      <p>Allocation Confirmation: {formatDate(selectedProject.allocationConfirmationDate)}</p>
                      <p>Disbursement Date: {formatDate(selectedProject.disbursementDate)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Visual Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="h-4 w-4 text-primary" />
                Lifecycle Stages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 text-xs">
                {stages.map((stage, idx) => {
                  const isCompleted = stage.status === "Completed"
                  const isInProgress = stage.status === "In Progress"
                  const isPending = stage.status === "Pending"

                  return (
                    <div key={stage.name} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full mt-1",
                            isCompleted && "bg-emerald-500",
                            isInProgress && "bg-blue-500",
                            isPending && "bg-gray-300 dark:bg-gray-600"
                          )}
                        />
                        {idx < stages.length - 1 && (
                          <div
                            className={cn(
                              "w-px flex-1 mt-1",
                              isCompleted ? "bg-emerald-500" : "bg-border"
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{stage.name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              isCompleted && "bg-emerald-50 text-emerald-700 border-emerald-200",
                              isInProgress && "bg-blue-50 text-blue-700 border-blue-200",
                              isPending && "bg-gray-50 text-gray-600 border-gray-200"
                            )}
                          >
                            {stage.status}
                          </Badge>
                        </div>
                        {stage.date && (
                          <p className="text-muted-foreground">
                            Date: {formatDate(stage.date)}
                            {stage.duration && ` • Duration: ${stage.duration}`}
                          </p>
                        )}
                        {stage.nextAction && (
                          <p className="text-amber-600 dark:text-amber-400 font-medium">
                            Next: {stage.nextAction}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Activity Tabs */}
        <div className="space-y-4">
          <Tabs defaultValue="commitments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="commitments">Commitments</TabsTrigger>
              <TabsTrigger value="qa">Q&A &amp; Communication</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
            </TabsList>

            <TabsContent value="commitments" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Commitments</p>
                    <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
                      {commitmentSummary.total}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Number of Lenders</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                      {commitmentSummary.lenders}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Average Rate</p>
                    <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
                      {commitmentSummary.avgRate.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-slate-100 dark:from-blue-950 dark:to-slate-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Window Status</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
                      {selectedProject?.commitmentWindowStatus || "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Visual Indicators */}
              {selectedProject && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Commitment Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Commitment vs Requirement</span>
                        <span className="font-medium">
                          {selectedProject.commitmentPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={selectedProject.commitmentPercentage} className="h-2" />
                    </div>
                    {selectedProject.commitmentPercentage >= 100 && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Oversubscribed:</strong> Project has received commitments exceeding the funding requirement.
                        </AlertDescription>
                      </Alert>
                    )}
                    {selectedProject.commitmentPercentage < 75 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Undersubscribed:</strong> Project has received less than 75% of funding requirement.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select value={commitmentStatusFilter} onValueChange={setCommitmentStatusFilter}>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {commitmentDateRange?.from ? (
                            commitmentDateRange.to ? (
                              <>
                                {commitmentDateRange.from.toLocaleDateString()} - {commitmentDateRange.to.toLocaleDateString()}
                              </>
                            ) : (
                              commitmentDateRange.from.toLocaleDateString()
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
                          defaultMonth={commitmentDateRange?.from}
                          selected={commitmentDateRange}
                          onSelect={setCommitmentDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Amount Range</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(commitmentAmountRange[0])} - {formatCurrency(commitmentAmountRange[1])}
                        </span>
                      </div>
                      <Slider
                        value={commitmentAmountRange}
                        onValueChange={(value) => setCommitmentAmountRange(value as [number, number])}
                        min={0}
                        max={100000000}
                        step={1000000}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commitments Table */}
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading commitments...</div>
              ) : commitments.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No commitments found.</div>
              ) : (
                <DataTable<LifecycleCommitment, any>
                  title="Commitments"
                  description="All lender commitments for this project"
                  columns={commitmentsColumns}
                  data={commitments}
                  showToolbar
                  showFooter
                  enableExport
                  exportFilename="project-commitments.csv"
                />
              )}
            </TabsContent>

            <TabsContent value="qa" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Queries</p>
                    <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
                      {qaSummary.total}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Open Queries</p>
                    <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
                      {qaSummary.open}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Answered Queries</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                      {qaSummary.answered}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Avg Response Time</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
                      {qaSummary.avgResponseTime > 0 ? `${qaSummary.avgResponseTime.toFixed(1)} hrs` : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Second row for 5th card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">SLA Compliance</p>
                    <p className="mt-2 text-2xl font-bold text-blue-950 dark:text-blue-50">
                      {qaSummary.slaCompliancePercent.toFixed(0)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select value={qaStatusFilter} onValueChange={setQaStatusFilter}>
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
                    <Select value={qaCategoryFilter} onValueChange={setQaCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="Timeline">Timeline</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={qaSlaFilter} onValueChange={setQaSlaFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="SLA Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All SLA</SelectItem>
                        <SelectItem value="on time">On Time</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {qaDateRange?.from ? (
                            qaDateRange.to ? (
                              <>
                                {qaDateRange.from.toLocaleDateString()} - {qaDateRange.to.toLocaleDateString()}
                              </>
                            ) : (
                              qaDateRange.from.toLocaleDateString()
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
                          defaultMonth={qaDateRange?.from}
                          selected={qaDateRange}
                          onSelect={setQaDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Q&A Table */}
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading queries...</div>
              ) : queries.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No queries found.</div>
              ) : (
                <DataTable<LifecycleQuery, any>
                  title="Q&A"
                  description="All lender queries and responses"
                  columns={queriesColumns}
                  data={queries}
                  showToolbar
                  showFooter
                  enableExport
                  exportFilename="project-qa.csv"
                />
              )}

              {/* Meeting Requests */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Meeting Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {meetingRequests.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">No meeting requests.</div>
                  ) : (
                    <div className="space-y-3">
                      {meetingRequests.map((meeting) => (
                        <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{meeting.requestedBy}</p>
                              <Badge variant="outline" className="text-xs capitalize">
                                {meeting.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{meeting.meetingType}</p>
                            <p className="text-xs text-muted-foreground">
                              Requested: {formatDate(meeting.requestDate)}
                              {meeting.scheduledDate && ` • Scheduled: ${formatDate(meeting.scheduledDate)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {meeting.recordingUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={meeting.recordingUrl} target="_blank" rel="noopener noreferrer">
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                  Recording
                                </a>
                              </Button>
                            )}
                            {meeting.status === "Pending" && (
                              <Button variant="outline" size="sm">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Schedule
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Requests</p>
                    <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
                      {docSummary.total}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Open Requests</p>
                    <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
                      {docSummary.open}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Fulfilled Requests</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                      {docSummary.fulfilled}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Avg Fulfillment Time</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
                      {docSummary.avgFulfillmentTime > 0 ? `${docSummary.avgFulfillmentTime.toFixed(1)} hrs` : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select value={docStatusFilter} onValueChange={setDocStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {docDateRange?.from ? (
                            docDateRange.to ? (
                              <>
                                {docDateRange.from.toLocaleDateString()} - {docDateRange.to.toLocaleDateString()}
                              </>
                            ) : (
                              docDateRange.from.toLocaleDateString()
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
                          defaultMonth={docDateRange?.from}
                          selected={docDateRange}
                          onSelect={setDocDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Document Requests Table */}
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading document requests...</div>
              ) : documentRequests.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No document requests found.</div>
              ) : (
                <DataTable<LifecycleDocumentRequest, any>
                  title="Document Requests"
                  description="Document requests raised by lenders"
                  columns={documentColumns}
                  data={documentRequests}
                  showToolbar
                  showFooter
                  enableExport
                  exportFilename="project-document-requests.csv"
                />
              )}

              {/* Document Library */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Library
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">No documents uploaded.</div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium text-sm">{doc.name}</p>
                              <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadDate)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allocation" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Allocation Status</p>
                    <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
                      {selectedProject?.allocationStatus || "—"}
                    </p>
                  </CardContent>
                </Card>
                {allocationSummary.daysSince !== undefined && (
                  <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 h-full">
                    <CardContent className="pt-5 pb-5">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Days Since Window Closure</p>
                      <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
                        {allocationSummary.daysSince}
                      </p>
                    </CardContent>
                  </Card>
                )}
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Selected Commitments</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                      {allocationSummary.selected}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-red-800 dark:text-red-200">Rejected Commitments</p>
                    <p className="mt-2 text-2xl font-bold text-red-950 dark:text-red-50">
                      {allocationSummary.rejected}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              {selectedProject && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Allocation Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Window Closure Date</p>
                        <p className="font-medium">{formatDate(selectedProject.commitmentWindowCloseDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Allocation Confirmation Due Date</p>
                        <p className="font-medium">
                          {selectedProject.commitmentWindowCloseDate
                            ? formatDate(
                                new Date(
                                  new Date(selectedProject.commitmentWindowCloseDate).getTime() + 7 * 24 * 60 * 60 * 1000
                                ).toISOString()
                              )
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual Confirmation Date</p>
                        <p className="font-medium">{formatDate(selectedProject.allocationConfirmationDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge
                          variant="outline"
                          className={
                            selectedProject.allocationConfirmationDate
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : allocationSummary.daysSince !== undefined && allocationSummary.daysSince > 7
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {selectedProject.allocationConfirmationDate
                            ? "On Time"
                            : allocationSummary.daysSince !== undefined && allocationSummary.daysSince > 7
                              ? "Overdue"
                              : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Allocation Table */}
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading allocation details...</div>
              ) : allocations.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No allocation records found.</div>
              ) : (
                <DataTable<LifecycleAllocationRow, any>
                  title="Allocation Details"
                  description="Allocation decisions for committed lenders"
                  columns={allocationColumns}
                  data={allocations}
                  showToolbar
                  showFooter
                  enableExport
                  exportFilename="project-allocation.csv"
                />
              )}
            </TabsContent>

            <TabsContent value="disbursement" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Expected</p>
                    <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
                      {formatCurrency(disbursementSummary.totalExpected)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Disbursements Received</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                      {disbursementSummary.received}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Pending Disbursements</p>
                    <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
                      {disbursementSummary.pending}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-slate-100 dark:from-blue-950 dark:to-slate-950 h-full">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Success Fee Status</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">
                      {disbursementSummary.successFeeCalculated}/{disbursements.length} Calculated
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Disbursement Table */}
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading disbursements...</div>
              ) : disbursements.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No disbursement records found.</div>
              ) : (
                <DataTable<LifecycleDisbursementRow, any>
                  title="Disbursements"
                  description="Disbursement documents, verification, and success fee status"
                  columns={disbursementColumns}
                  data={disbursements}
                  showToolbar
                  showFooter
                  enableExport
                  exportFilename="project-disbursements.csv"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Section: Action Items & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actionItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No pending action items.</div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.title}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            item.priority === "High" && "bg-red-50 text-red-700 border-red-200",
                            item.priority === "Medium" && "bg-amber-50 text-amber-700 border-amber-200",
                            item.priority === "Low" && "bg-blue-50 text-blue-700 border-blue-200"
                          )}
                        >
                          {item.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.status}
                        </Badge>
                      </div>
                      {item.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(item.dueDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === "Pending" && (
                        <Button variant="outline" size="sm">
                          <Send className="mr-2 h-4 w-4" />
                          Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectAlerts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No alerts.</div>
            ) : (
              <div className="space-y-3">
                {projectAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={
                      alert.type === "critical"
                        ? "destructive"
                        : alert.type === "warning"
                          ? "default"
                          : "default"
                    }
                    className={cn(
                      alert.type === "warning" && "bg-amber-50 border-amber-200 dark:bg-amber-950",
                      alert.type === "info" && "bg-blue-50 border-blue-200 dark:bg-blue-950"
                    )}
                  >
                    {alert.type === "critical" && <AlertCircle className="h-4 w-4" />}
                    {alert.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                    {alert.type === "info" && <CheckCircle2 className="h-4 w-4" />}
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(alert.timestamp)}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



