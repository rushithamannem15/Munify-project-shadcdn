import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/data-table/data-table'
import { 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  Star, 
  MessageSquare, 
  FileText,
  TrendingUp,
  AlertCircle,
  Eye,
  Edit,
  X,
  Heart,
  Download,
  Filter,
  Calendar,
  MapPin,
  Building2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'

// Types
interface ActiveProject {
  id: string
  projectName: string
  municipality: string
  stage: 'Commitment Stage' | 'Funding Completed' | 'Implementation' | 'Closed'
  commitmentAmount: number
  commitmentRate: number
  commitmentDate: string
  acceptanceStatus: 'Accepted' | 'Rejected' | 'Pending'
  acceptanceAmount: number | null
  windowStatus: 'Open' | 'Closing Soon' | 'Closed'
  daysRemaining: number | null
  isFavorited: boolean
  lastUpdate: string
  category: string
}

interface Activity {
  id: string
  type: 'new_project' | 'favorited' | 'commitment' | 'window_closure' | 'allocation' | 'qa_response' | 'progress_update' | 'document_upload'
  title: string
  description: string
  timestamp: string
  projectId?: string
  projectName?: string
  isUnread: boolean
}

// Mock data
const mockProjects: ActiveProject[] = [
  {
    id: '1',
    projectName: 'Smart Water Management System',
    municipality: 'Mumbai Municipal Corporation',
    stage: 'Commitment Stage',
    commitmentAmount: 50000000,
    commitmentRate: 8.5,
    commitmentDate: '2024-01-15',
    acceptanceStatus: 'Accepted',
    acceptanceAmount: 50000000,
    windowStatus: 'Open',
    daysRemaining: 15,
    isFavorited: true,
    lastUpdate: '2024-01-20',
    category: 'Infrastructure'
  },
  {
    id: '2',
    projectName: 'Urban Waste Management',
    municipality: 'Delhi Municipal Corporation',
    stage: 'Funding Completed',
    commitmentAmount: 75000000,
    commitmentRate: 9.0,
    commitmentDate: '2023-12-10',
    acceptanceStatus: 'Accepted',
    acceptanceAmount: 75000000,
    windowStatus: 'Closed',
    daysRemaining: null,
    isFavorited: false,
    lastUpdate: '2024-01-18',
    category: 'Environment'
  },
  {
    id: '3',
    projectName: 'Digital Infrastructure Upgrade',
    municipality: 'Bangalore Municipal Corporation',
    stage: 'Implementation',
    commitmentAmount: 100000000,
    commitmentRate: 8.75,
    commitmentDate: '2023-11-20',
    acceptanceStatus: 'Pending',
    acceptanceAmount: null,
    windowStatus: 'Closing Soon',
    daysRemaining: 3,
    isFavorited: true,
    lastUpdate: '2024-01-19',
    category: 'Technology'
  },
]

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'new_project',
    title: 'New Project Available',
    description: 'Smart Water Management System matches your criteria',
    timestamp: '2024-01-20T10:30:00',
    projectId: '1',
    projectName: 'Smart Water Management System',
    isUnread: true
  },
  {
    id: '2',
    type: 'commitment',
    title: 'Commitment Updated',
    description: 'Your commitment to Urban Waste Management was updated',
    timestamp: '2024-01-19T14:20:00',
    projectId: '2',
    projectName: 'Urban Waste Management',
    isUnread: false
  },
  {
    id: '3',
    type: 'allocation',
    title: 'Allocation Confirmed',
    description: 'Your commitment to Smart Water Management System has been accepted',
    timestamp: '2024-01-18T09:15:00',
    projectId: '1',
    projectName: 'Smart Water Management System',
    isUnread: false
  },
  {
    id: '4',
    type: 'progress_update',
    title: 'Progress Update',
    description: 'Digital Infrastructure Upgrade: 45% completion milestone achieved',
    timestamp: '2024-01-17T16:45:00',
    projectId: '3',
    projectName: 'Digital Infrastructure Upgrade',
    isUnread: true
  },
  {
    id: '5',
    type: 'qa_response',
    title: 'Q&A Response Received',
    description: 'Response received for your question on Smart Water Management System',
    timestamp: '2024-01-16T11:30:00',
    projectId: '1',
    projectName: 'Smart Water Management System',
    isUnread: false
  },
]

// Calculate KPIs from mock data
const calculateKPIs = () => {
  const committedProjects = mockProjects.filter(p => p.acceptanceStatus !== 'Rejected')
  const totalCommitted = committedProjects.length
  const totalCommitmentAmount = mockProjects.reduce((sum, p) => sum + p.commitmentAmount, 0)
  const totalAcceptedAmount = mockProjects
    .filter(p => p.acceptanceStatus === 'Accepted')
    .reduce((sum, p) => sum + (p.acceptanceAmount || 0), 0)
  const acceptanceRatio = totalCommitted > 0 
    ? Math.round((mockProjects.filter(p => p.acceptanceStatus === 'Accepted').length / totalCommitted) * 100)
    : 0
  const activeCommitments = mockProjects.filter(p => 
    p.stage === 'Commitment Stage' || p.stage === 'Funding Completed'
  ).length
  const favoritedProjects = mockProjects.filter(p => p.isFavorited).length
  const pendingQA = 3 // Mock value
  const projectsWithNotes = 5 // Mock value

  return {
    totalProjectsCommitted: totalCommitted,
    totalCommitmentAmount,
    totalAcceptedAmount,
    overallAcceptanceRatio: acceptanceRatio,
    activeCommitments,
    favoritedProjects,
    pendingQA,
    projectsWithNotes
  }
}

export default function LenderDashboard() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    projectStatus: [] as string[],
    commitmentStatus: '',
    windowStatus: '',
    municipality: [] as string[],
    category: [] as string[],
    dateRange: '',
    favouritesOnly: false,
    committedOnly: false,
  })
  const [activityFilter, setActivityFilter] = useState<string>('all')

  const kpis = calculateKPIs()

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'new_project':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'favorited':
        return <Star className="h-4 w-4 text-yellow-500" />
      case 'commitment':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'window_closure':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'allocation':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'qa_response':
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'progress_update':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'document_upload':
        return <FileText className="h-4 w-4 text-indigo-500" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'new_project':
        return 'border-l-blue-500'
      case 'favorited':
        return 'border-l-yellow-500'
      case 'commitment':
        return 'border-l-green-500'
      case 'window_closure':
        return 'border-l-orange-500'
      case 'allocation':
        return 'border-l-green-500'
      case 'qa_response':
        return 'border-l-purple-500'
      case 'progress_update':
        return 'border-l-blue-500'
      case 'document_upload':
        return 'border-l-indigo-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const filteredActivities = activityFilter === 'all' 
    ? mockActivities 
    : mockActivities.filter(a => a.type === activityFilter)

  const columns: ColumnDef<ActiveProject, any>[] = [
    {
      accessorKey: 'projectName',
      header: 'Project Name',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={() => navigate(`/main/projects/${row.original.id}`)}
        >
          {row.original.projectName}
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'municipality',
      header: 'Municipality',
      cell: ({ row }) => <span>{row.original.municipality}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => {
        const stageColors: Record<string, string> = {
          'Commitment Stage': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          'Funding Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          'Implementation': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        }
        return (
          <Badge className={stageColors[row.original.stage] || ''}>
            {row.original.stage}
          </Badge>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentAmount',
      header: 'Commitment Amount',
      cell: ({ row }) => <span>{formatCurrency(row.original.commitmentAmount)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentRate',
      header: 'Commitment Rate (%)',
      cell: ({ row }) => <span>{row.original.commitmentRate}%</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentDate',
      header: 'Commitment Date',
      cell: ({ row }) => <span>{formatDate(row.original.commitmentDate)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'acceptanceStatus',
      header: 'Acceptance Status',
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          'Accepted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        }
        return (
          <Badge className={statusColors[row.original.acceptanceStatus] || ''}>
            {row.original.acceptanceStatus}
          </Badge>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'acceptanceAmount',
      header: 'Acceptance Amount',
      cell: ({ row }) => (
        <span>
          {row.original.acceptanceAmount 
            ? formatCurrency(row.original.acceptanceAmount)
            : '—'
          }
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'windowStatus',
      header: 'Window Status',
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          'Open': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          'Closing Soon': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        }
        return (
          <Badge className={statusColors[row.original.windowStatus] || ''}>
            {row.original.windowStatus}
          </Badge>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'daysRemaining',
      header: 'Days Remaining',
      cell: ({ row }) => (
        <span>
          {row.original.daysRemaining !== null 
            ? `${row.original.daysRemaining} days`
            : '—'
          }
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'isFavorited',
      header: 'Favourite Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isFavorited ? 'default' : 'outline'}>
          {row.original.isFavorited ? 'Favourited' : 'Not Favourited'}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'lastUpdate',
      header: 'Last Update',
      cell: ({ row }) => <span>{formatDate(row.original.lastUpdate)}</span>,
      enableSorting: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/main/projects/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Handle update commitment
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lender Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your portfolio, commitments, and activities
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects Committed</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalProjectsCommitted}</div>
            <p className="text-xs text-muted-foreground">
              Projects with active commitments
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commitment Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.totalCommitmentAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Sum of all commitment amounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accepted Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.totalAcceptedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Sum of all accepted commitments
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Acceptance Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.overallAcceptanceRatio}%</div>
            <p className="text-xs text-muted-foreground">
              Percentage of commitments accepted
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Commitments</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeCommitments}</div>
            <p className="text-xs text-muted-foreground">
              Commitments in active projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favourited Projects</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.favoritedProjects}</div>
            <p className="text-xs text-muted-foreground">
              Count of favorited projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Q&A</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingQA}</div>
            <p className="text-xs text-muted-foreground">
              Unanswered queries from lender
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects with Notes</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.projectsWithNotes}</div>
            <p className="text-xs text-muted-foreground">
              Count of projects with personal notes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>
                Committed & Favorited projects overview
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Project Status</Label>
                      <div className="space-y-2 mt-2">
                        {['Active', 'Funding Completed', 'Implementation', 'Closed'].map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={filters.projectStatus.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({
                                    ...filters,
                                    projectStatus: [...filters.projectStatus, status]
                                  })
                                } else {
                                  setFilters({
                                    ...filters,
                                    projectStatus: filters.projectStatus.filter(s => s !== status)
                                  })
                                }
                              }}
                            />
                            <Label htmlFor={`status-${status}`} className="text-sm font-normal">
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">Commitment Status</Label>
                      <Select
                        value={filters.commitmentStatus}
                        onValueChange={(value) => setFilters({ ...filters, commitmentStatus: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          <SelectItem value="Committed">Committed</SelectItem>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">Window Status</Label>
                      <Select
                        value={filters.windowStatus}
                        onValueChange={(value) => setFilters({ ...filters, windowStatus: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closing Soon">Closing Soon</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="favourites-only"
                        checked={filters.favouritesOnly}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, favouritesOnly: !!checked })
                        }
                      />
                      <Label htmlFor="favourites-only" className="text-sm font-normal">
                        Favourites Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="committed-only"
                        checked={filters.committedOnly}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, committedOnly: !!checked })
                        }
                      />
                      <Label htmlFor="committed-only" className="text-sm font-normal">
                        Committed Only
                      </Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<ActiveProject, any>
            columns={columns}
            data={mockProjects}
            showToolbar={true}
            showFooter={true}
            enableExport={true}
            exportFilename="lender-portfolio.csv"
          />
        </CardContent>
      </Card>

      {/* Recent Activities Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Timeline of your portfolio activities
              </CardDescription>
            </div>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="new_project">New Projects</SelectItem>
                <SelectItem value="favorited">Favorited</SelectItem>
                <SelectItem value="commitment">Commitments</SelectItem>
                <SelectItem value="window_closure">Window Closures</SelectItem>
                <SelectItem value="allocation">Allocations</SelectItem>
                <SelectItem value="qa_response">Q&A Responses</SelectItem>
                <SelectItem value="progress_update">Progress Updates</SelectItem>
                <SelectItem value="document_upload">Document Uploads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found
              </div>
            ) : (
              filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`relative pl-8 pb-4 border-l-2 ${getActivityColor(activity.type)} ${
                    index < filteredActivities.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <div className="absolute left-0 top-0 -translate-x-[9px]">
                    <div className="rounded-full bg-background border-2 border-current p-1">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{activity.title}</h4>
                        {activity.isUnread && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      {activity.projectName && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm mt-1"
                          onClick={() => activity.projectId && navigate(`/main/projects/${activity.projectId}`)}
                        >
                          View Project: {activity.projectName}
                        </Button>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

