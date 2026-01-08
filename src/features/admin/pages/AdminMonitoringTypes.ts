export type HealthStatus = "healthy" | "at_risk" | "critical"

export interface AdminMonitoringKpis {
  totalActiveProjects: number
  totalCommitments: number
  pendingAllocations: number
  pendingQa: number
  pendingDocumentRequests: number
  fullyFundedProjects: number
  projectsAtRisk: number
  totalFundingGap: number
}

export interface AdminMonitoringProject {
  id: number
  projectName: string
  municipality: string
  stage: string
  fundingRequirement: number
  committedAmount: number
  commitmentPercentage: number
  gapAmount: number
  windowStatus: "open" | "closing_soon" | "closed"
  daysRemaining: number
  qaTotalCount: number
  qaOpenCount: number
  documentRequestsOpenCount: number
  allocationStatus: "pending" | "confirmed" | "overdue"
  healthStatus: HealthStatus
}

export type AdminMonitoringActivityType =
  | "project_submitted"
  | "project_approved"
  | "project_rejected"
  | "commitment_received"
  | "commitment_window_closed"
  | "allocation_confirmed"
  | "qa_response"
  | "document_uploaded"
  | "disbursement_uploaded"
  | "status_changed"

export interface AdminMonitoringActivity {
  id: string | number
  type: AdminMonitoringActivityType
  projectName?: string
  municipality?: string
  occurredAt: string
  description: string
}

export interface AdminMonitoringMasterDashboardResponse {
  kpis: AdminMonitoringKpis
  activeProjects: AdminMonitoringProject[]
  recentActivities: AdminMonitoringActivity[]
}



