import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  MessageSquare,
  FileText,
  Bell,
  Eye,
  BarChart3,
  Activity,
  ArrowUpDown,
  MoreHorizontal,
  Target,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataTable, type ColumnDef } from '@/components/data-table/data-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

// TypeScript Interfaces
interface MunicipalityKPIs {
  totalProjects: number
  activeProjects: number
  fullyFundedProjects: number
  fundingGap: number
  pendingAllocations: number
  openLenderQueries: number
  upcomingClosures: number
}

interface AlertItem {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  projectId?: string
  projectName?: string
  timestamp: string
  actionUrl?: string
}

interface MunicipalityProject {
  id: string
  projectName: string
  projectId: string
  status: string
  fundingRequirement: number
  committedAmount: number
  commitmentPercent: number
  fundingGap: number
  windowStatus: 'open' | 'closed' | 'pending'
  allocationStatus: 'pending' | 'confirmed' | 'not_applicable'
  openQACount: number
  sector?: string
  category?: string
  createdAt?: string
  windowCloseDate?: string
}

interface ActivityItem {
  id: string
  type: 'project_submission' | 'commitment' | 'qa_response' | 'allocation' | 'progress_update'
  title: string
  description: string
  projectId?: string
  projectName?: string
  timestamp: string
  icon: string
}

// Hardcoded Mock Data
const MOCK_KPIS: MunicipalityKPIs = {
  totalProjects: 24,
  activeProjects: 12,
  fullyFundedProjects: 8,
  fundingGap: 450000000, // 45 Cr
  pendingAllocations: 3,
  openLenderQueries: 7,
  upcomingClosures: 2,
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Allocation Overdue',
    message: 'Allocation confirmation pending for Smart City Infrastructure Project. Action required within 2 days.',
    projectId: '1',
    projectName: 'Smart City Infrastructure Project',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/main/projects/1',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Funding Window Closing Soon',
    message: 'Funding window for Water Supply Enhancement closes in 3 days. Ensure all commitments are finalized.',
    projectId: '2',
    projectName: 'Water Supply Enhancement',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/main/projects/2',
  },
  {
    id: '3',
    type: 'warning',
    title: 'SLA Breach Risk',
    message: '3 lender queries are approaching SLA deadline. Please respond within 24 hours.',
    projectId: '3',
    projectName: 'Urban Road Development',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/main/municipal/qa',
  },
  {
    id: '4',
    type: 'info',
    title: 'New Commitment Received',
    message: 'A new commitment of ₹2.5Cr has been received for Waste Management Initiative.',
    projectId: '4',
    projectName: 'Waste Management Initiative',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/main/projects/4',
  },
]

const MOCK_PROJECTS: MunicipalityProject[] = [
  {
    id: '1',
    projectName: 'Smart City Infrastructure Project',
    projectId: 'MUNI-PROJ-2024-001',
    status: 'active',
    fundingRequirement: 50000000, // 5 Cr
    committedAmount: 45000000, // 4.5 Cr
    commitmentPercent: 90,
    fundingGap: 5000000, // 50 L
    windowStatus: 'closed',
    allocationStatus: 'pending',
    openQACount: 2,
    sector: 'Infrastructure',
    category: 'Smart City',
    createdAt: '2024-01-15',
    windowCloseDate: '2024-02-15',
  },
  {
    id: '2',
    projectName: 'Water Supply Enhancement',
    projectId: 'MUNI-PROJ-2024-002',
    status: 'active',
    fundingRequirement: 75000000, // 7.5 Cr
    committedAmount: 60000000, // 6 Cr
    commitmentPercent: 80,
    fundingGap: 15000000, // 1.5 Cr
    windowStatus: 'open',
    allocationStatus: 'not_applicable',
    openQACount: 1,
    sector: 'Water & Sanitation',
    category: 'Water Supply',
    createdAt: '2024-01-20',
    windowCloseDate: '2024-03-20',
  },
  {
    id: '3',
    projectName: 'Urban Road Development',
    projectId: 'MUNI-PROJ-2024-003',
    status: 'active',
    fundingRequirement: 120000000, // 12 Cr
    committedAmount: 120000000, // 12 Cr
    commitmentPercent: 100,
    fundingGap: 0,
    windowStatus: 'closed',
    allocationStatus: 'confirmed',
    openQACount: 3,
    sector: 'Transportation',
    category: 'Road Development',
    createdAt: '2024-01-10',
    windowCloseDate: '2024-02-10',
  },
  {
    id: '4',
    projectName: 'Waste Management Initiative',
    projectId: 'MUNI-PROJ-2024-004',
    status: 'active',
    fundingRequirement: 30000000, // 3 Cr
    committedAmount: 25000000, // 2.5 Cr
    commitmentPercent: 83,
    fundingGap: 5000000, // 50 L
    windowStatus: 'open',
    allocationStatus: 'not_applicable',
    openQACount: 0,
    sector: 'Environment',
    category: 'Waste Management',
    createdAt: '2024-02-01',
    windowCloseDate: '2024-04-01',
  },
  {
    id: '5',
    projectName: 'Digital Governance Platform',
    projectId: 'MUNI-PROJ-2024-005',
    status: 'draft',
    fundingRequirement: 40000000, // 4 Cr
    committedAmount: 0,
    commitmentPercent: 0,
    fundingGap: 40000000, // 4 Cr
    windowStatus: 'pending',
    allocationStatus: 'not_applicable',
    openQACount: 0,
    sector: 'Technology',
    category: 'Digital Infrastructure',
    createdAt: '2024-02-15',
  },
  {
    id: '6',
    projectName: 'Solar Power Plant',
    projectId: 'MUNI-PROJ-2024-006',
    status: 'active',
    fundingRequirement: 100000000, // 10 Cr
    committedAmount: 100000000, // 10 Cr
    commitmentPercent: 100,
    fundingGap: 0,
    windowStatus: 'closed',
    allocationStatus: 'confirmed',
    openQACount: 1,
    sector: 'Energy',
    category: 'Renewable Energy',
    createdAt: '2024-01-05',
    windowCloseDate: '2024-02-05',
  },
  {
    id: '7',
    projectName: 'Public Health Center',
    projectId: 'MUNI-PROJ-2024-007',
    status: 'active',
    fundingRequirement: 60000000, // 6 Cr
    committedAmount: 35000000, // 3.5 Cr
    commitmentPercent: 58,
    fundingGap: 25000000, // 2.5 Cr
    windowStatus: 'open',
    allocationStatus: 'not_applicable',
    openQACount: 0,
    sector: 'Healthcare',
    category: 'Public Health',
    createdAt: '2024-02-10',
    windowCloseDate: '2024-04-10',
  },
  {
    id: '8',
    projectName: 'Educational Infrastructure',
    projectId: 'MUNI-PROJ-2024-008',
    status: 'approved',
    fundingRequirement: 45000000, // 4.5 Cr
    committedAmount: 0,
    commitmentPercent: 0,
    fundingGap: 45000000, // 4.5 Cr
    windowStatus: 'pending',
    allocationStatus: 'not_applicable',
    openQACount: 0,
    sector: 'Education',
    category: 'Infrastructure',
    createdAt: '2024-02-20',
  },
]

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'commitment',
    title: 'New Commitment Received',
    description: 'A commitment of ₹2.5Cr received for Waste Management Initiative from ABC Bank',
    projectId: '4',
    projectName: 'Waste Management Initiative',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    icon: 'IndianRupee',
  },
  {
    id: '2',
    type: 'qa_response',
    title: 'Q&A Response Submitted',
    description: 'Response submitted for query regarding Smart City Infrastructure Project',
    projectId: '1',
    projectName: 'Smart City Infrastructure Project',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    icon: 'MessageSquare',
  },
  {
    id: '3',
    type: 'allocation',
    title: 'Allocation Confirmed',
    description: 'Allocation confirmed for Urban Road Development project',
    projectId: '3',
    projectName: 'Urban Road Development',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    icon: 'CheckCircle',
  },
  {
    id: '4',
    type: 'progress_update',
    title: 'Progress Update Posted',
    description: 'Milestone 2 completed (40%) for Solar Power Plant project',
    projectId: '6',
    projectName: 'Solar Power Plant',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    icon: 'Activity',
  },
  {
    id: '5',
    type: 'project_submission',
    title: 'Project Submitted',
    description: 'Educational Infrastructure project submitted for review',
    projectId: '8',
    projectName: 'Educational Infrastructure',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'FolderKanban',
  },
]

export default function MunicipalityDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const municipalityName = user?.data?.organization_name || user?.data?.branchName || 'Municipality'

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [windowStatusFilter, setWindowStatusFilter] = useState<string>('all')
  const [allocationStatusFilter, setAllocationStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Check if user is admin (for role-based access)
  const isAdmin = useMemo(() => {
    const userData = user?.data
    return (
      userData?.roleCode?.toLowerCase().includes('admin') ||
      userData?.userType?.toLowerCase() === 'admin' ||
      userData?.org_type?.toLowerCase() === 'municipality_admin'
    )
  }, [user])

  // Use hardcoded data
  const kpisData = MOCK_KPIS
  const alertsData = MOCK_ALERTS
  const activitiesData = MOCK_ACTIVITIES
  const allProjects = MOCK_PROJECTS

  // Filter projects
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      // Status filter - handle special cases
      let matchesStatus = true
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          // Active Projects = Projects in commitment stage
          matchesStatus = p.status.toLowerCase() === 'active' || p.status.toLowerCase() === 'commitment'
        } else {
          matchesStatus = p.status.toLowerCase() === statusFilter.toLowerCase()
        }
      }

      // Window status filter
      const matchesWindow =
        windowStatusFilter === 'all' || p.windowStatus.toLowerCase() === windowStatusFilter.toLowerCase()

      // Allocation status filter
      const matchesAllocation =
        allocationStatusFilter === 'all' ||
        p.allocationStatus.toLowerCase() === allocationStatusFilter.toLowerCase()

      // Search filter - handle special keywords
      let matchesSearch = true
      if (searchQuery !== '') {
        const query = searchQuery.toLowerCase()
        if (query === 'fully funded') {
          matchesSearch = p.commitmentPercent === 100
        } else if (query === 'funding gap') {
          matchesSearch = p.fundingGap > 0
        } else {
          matchesSearch =
            p.projectName.toLowerCase().includes(query) || p.projectId.toLowerCase().includes(query)
        }
      }

      return matchesStatus && matchesWindow && matchesAllocation && matchesSearch
    })
  }, [statusFilter, windowStatusFilter, allocationStatusFilter, searchQuery, allProjects])

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    }
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Table columns
  const columns: ColumnDef<MunicipalityProject, any>[] = [
    {
      accessorKey: 'projectName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Project Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <button
            onClick={() => navigate(`/main/projects/${row.original.id}`)}
            className="font-medium text-left hover:underline text-blue-600 dark:text-blue-400"
          >
            {row.original.projectName}
          </button>
          <span className="text-xs text-muted-foreground">ID: {row.original.projectId}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusColors: Record<string, string> = {
          active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          commitment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          approved: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        }
        return (
          <Badge
            variant="secondary"
            className={statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'fundingRequirement',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Funding Requirement
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => formatCurrency(row.original.fundingRequirement),
    },
    {
      accessorKey: 'committedAmount',
      header: 'Committed Amount',
      cell: ({ row }) => formatCurrency(row.original.committedAmount),
    },
    {
      accessorKey: 'commitmentPercent',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Commitment %
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.commitmentPercent}%</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
            <div
              className={cn(
                'h-full transition-all',
                row.original.commitmentPercent >= 100
                  ? 'bg-green-600'
                  : row.original.commitmentPercent >= 75
                    ? 'bg-blue-600'
                    : row.original.commitmentPercent >= 50
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
              )}
              style={{ width: `${Math.min(100, row.original.commitmentPercent)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'fundingGap',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Funding Gap
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className={row.original.fundingGap > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatCurrency(row.original.fundingGap)}
        </span>
      ),
    },
    {
      accessorKey: 'windowStatus',
      header: 'Window Status',
      cell: ({ row }) => {
        const status = row.original.windowStatus
        const colors: Record<string, string> = {
          open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        }
        return (
          <Badge variant="secondary" className={colors[status] || 'bg-gray-100 text-gray-800'}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'allocationStatus',
      header: 'Allocation Status',
      cell: ({ row }) => {
        const status = row.original.allocationStatus
        const colors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          not_applicable: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        }
        return (
          <Badge variant="secondary" className={colors[status] || 'bg-gray-100 text-gray-800'}>
            {status.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'openQACount',
      header: 'Open Q&A',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className={row.original.openQACount > 0 ? 'font-medium text-orange-600' : 'text-muted-foreground'}>
            {row.original.openQACount}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/main/projects/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Project
            </DropdownMenuItem>
            {row.original.openQACount > 0 && (
              <DropdownMenuItem
                onClick={() => navigate(`/main/projects/${row.original.id}?tab=qa`)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Respond to Q&A ({row.original.openQACount})
              </DropdownMenuItem>
            )}
            {isAdmin && row.original.allocationStatus === 'pending' && (
              <DropdownMenuItem
                onClick={() => navigate(`/main/projects/${row.original.id}?tab=allocation`)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Allocation
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => navigate(`/main/municipal/projects/${row.original.id}/progress/update`)}
              >
                <Activity className="mr-2 h-4 w-4" />
                Post Update
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate(`/main/projects/${row.original.id}?tab=commitments`)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Commitments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Municipality Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">
            Welcome, {municipalityName} • Track your projects and funding status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Notifications ({alertsData.length})
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer border-none shadow-sm bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950"
          onClick={() => {
            setStatusFilter('all')
            setWindowStatusFilter('all')
            setAllocationStatusFilter('all')
            setSearchQuery('')
            setTimeout(() => {
              const element = document.getElementById('projects-table')
              if (element) {
                const yOffset = -20
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                window.scrollTo({ top: y, behavior: 'smooth' })
              }
            }, 150)
          }}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-sky-800 dark:text-sky-200">Total Projects</p>
                <p className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-50">
                  {kpisData.totalProjects}
                </p>
              </div>
              <FolderKanban className="h-6 w-6 text-sky-700 dark:text-sky-300" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950"
          onClick={() => {
            setStatusFilter('active')
            setWindowStatusFilter('all')
            setAllocationStatusFilter('all')
            setSearchQuery('')
            setTimeout(() => {
              const element = document.getElementById('projects-table')
              if (element) {
                const yOffset = -20
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                window.scrollTo({ top: y, behavior: 'smooth' })
              }
            }, 150)
          }}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Active Projects</p>
                <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                  {kpisData.activeProjects}
                </p>
              </div>
              <Activity className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-950"
          onClick={() => {
            setStatusFilter('all')
            setWindowStatusFilter('all')
            setAllocationStatusFilter('all')
            setSearchQuery('fully funded')
            setTimeout(() => {
              const element = document.getElementById('projects-table')
              if (element) {
                const yOffset = -20
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                window.scrollTo({ top: y, behavior: 'smooth' })
              }
            }, 150)
          }}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-800 dark:text-purple-200">Fully Funded Projects</p>
                <p className="mt-2 text-2xl font-bold text-purple-950 dark:text-purple-50">
                  {kpisData.fullyFundedProjects}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-purple-700 dark:text-purple-300" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-none shadow-sm bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950 dark:to-orange-950"
          onClick={() => {
            setStatusFilter('all')
            setWindowStatusFilter('all')
            setAllocationStatusFilter('all')
            setSearchQuery('funding gap')
            setTimeout(() => {
              const element = document.getElementById('projects-table')
              if (element) {
                const yOffset = -20
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                window.scrollTo({ top: y, behavior: 'smooth' })
              }
            }, 150)
          }}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-800 dark:text-red-200">Funding Gap</p>
                <p className="mt-2 text-2xl font-bold text-red-950 dark:text-red-50">
                  {formatCurrency(kpisData.fundingGap)}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-red-700 dark:text-red-300" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950"
          onClick={() => {
            setStatusFilter('all')
            setWindowStatusFilter('all')
            setAllocationStatusFilter('pending')
            setSearchQuery('')
            setTimeout(() => {
              const element = document.getElementById('projects-table')
              if (element) {
                const yOffset = -20
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                window.scrollTo({ top: y, behavior: 'smooth' })
              }
            }, 150)
          }}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Pending Allocations</p>
                <p className="mt-2 text-2xl font-bold text-amber-950 dark:text-amber-50">
                  {kpisData.pendingAllocations}
                </p>
              </div>
              <Clock className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-none shadow-sm bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-950"
          onClick={() => navigate('/main/municipal/qa')}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Open Lender Queries</p>
                <p className="mt-2 text-2xl font-bold text-blue-950 dark:text-blue-50">
                  {kpisData.openLenderQueries}
                </p>
              </div>
              <MessageSquare className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-none shadow-sm bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-950"
          onClick={() => {
            setStatusFilter('all')
            setWindowStatusFilter('open')
            setAllocationStatusFilter('all')
            setSearchQuery('')
            setTimeout(() => {
              const element = document.getElementById('projects-table')
              if (element) {
                const yOffset = -20
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                window.scrollTo({ top: y, behavior: 'smooth' })
              }
            }, 150)
          }}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">Upcoming Closures</p>
                <p className="mt-2 text-2xl font-bold text-orange-950 dark:text-orange-50">
                  {kpisData.upcomingClosures}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-700 dark:text-orange-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Required / Alerts Panel - Enhanced */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            Action Required / Alerts
            <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
              {alertsData.length}
            </Badge>
          </CardTitle>
          <CardDescription>Items requiring your immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {alertsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
              <p className="font-medium">No alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertsData.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.type === 'critical' ? 'destructive' : 'default'}
                  className={cn(
                    alert.type === 'warning' && 'bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700',
                    alert.type === 'info' && 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700',
                    alert.type === 'critical' && 'border-2',
                    'cursor-pointer hover:shadow-md transition-all duration-200'
                  )}
                  onClick={() => {
                    if (alert.actionUrl) {
                      navigate(alert.actionUrl)
                    }
                  }}
                >
                  {alert.type === 'critical' && <AlertCircle className="h-5 w-5" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                  {alert.type === 'info' && <Info className="h-5 w-5" />}
                  <AlertDescription>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1">
                        <p className="font-semibold text-base leading-tight">{alert.title}</p>
                        <p className="text-sm leading-relaxed text-foreground">{alert.message}</p>
                        {alert.projectName && (
                          <p className="text-xs text-muted-foreground font-medium mt-1">Project: {alert.projectName}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1.5">{formatDate(alert.timestamp)}</p>
                      </div>
                      {alert.actionUrl && (
                        <Button
                          size="sm"
                          variant={alert.type === 'critical' ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(alert.actionUrl!)
                          }}
                          className="shrink-0 self-start mt-0.5"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Projects Table - Enhanced */}
      <Card id="projects-table" className="shadow-lg border-2 scroll-mt-4">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-950 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                My Projects
                {(statusFilter !== 'all' || windowStatusFilter !== 'all' || allocationStatusFilter !== 'all' || searchQuery !== '') && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Filtered
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {statusFilter !== 'all' || windowStatusFilter !== 'all' || allocationStatusFilter !== 'all' || searchQuery !== ''
                  ? `Showing ${filteredProjects.length} of ${allProjects.length} projects`
                  : `All projects created by your municipality • ${filteredProjects.length} of ${allProjects.length} projects`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="commitment">Commitment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={windowStatusFilter} onValueChange={setWindowStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Windows</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={allocationStatusFilter} onValueChange={setAllocationStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Allocation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Allocations</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="not_applicable">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No projects found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || windowStatusFilter !== 'all' || allocationStatusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new project'}
              </p>
            </div>
          ) : (
            <DataTable<MunicipalityProject, any>
              columns={columns}
              data={filteredProjects}
              showToolbar={true}
              showFooter={true}
              enableExport={true}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions - Enhanced */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 text-base hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => navigate('/main/admin/projects/create')}
                >
                  <FolderKanban className="mr-3 h-5 w-5" />
                  Create New Project
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => navigate('/main/municipal/qa')}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Respond to Q&A
                {kpisData.openLenderQueries > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-orange-200 text-orange-800">
                    {kpisData.openLenderQueries}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base hover:bg-purple-50 dark:hover:bg-purple-950"
                onClick={() => navigate('/main/municipal/document-requests')}
              >
                <FileText className="mr-3 h-5 w-5" />
                Document Requests
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base hover:bg-indigo-50 dark:hover:bg-indigo-950"
                onClick={() => navigate('/main/municipal/projects/progress')}
              >
                <Activity className="mr-3 h-5 w-5" />
                Project Progress
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => navigate('/main/admin/reports')}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Timeline - Enhanced */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and events</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {activitiesData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activitiesData.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                        {activity.type === 'project_submission' && (
                          <FolderKanban className="h-5 w-5 text-white" />
                        )}
                        {activity.type === 'commitment' && <IndianRupee className="h-5 w-5 text-white" />}
                        {activity.type === 'qa_response' && <MessageSquare className="h-5 w-5 text-white" />}
                        {activity.type === 'allocation' && <CheckCircle className="h-5 w-5 text-white" />}
                        {activity.type === 'progress_update' && <Activity className="h-5 w-5 text-white" />}
                      </div>
                      {index < activitiesData.length - 1 && (
                        <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1 pb-4">
                      <p className="text-sm font-semibold">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.projectName && (
                        <p className="text-xs text-muted-foreground font-medium">Project: {activity.projectName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
