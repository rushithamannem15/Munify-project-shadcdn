import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle2,
  Search,
  Calendar,
  User,
  Video,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface DocumentRequest {
  id: number
  project_reference_id: string
  requested_by: string
  description: string
  requested_at: string
  request_type: 'document' | 'meeting'
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  responded_at?: string | null
  responded_by?: string | null
  meeting_scheduled_at?: string | null
  meeting_link?: string | null
  project?: {
    id: number
    title: string
    organization_id: string
  }
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

export default function MunicipalDocumentRequests() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  const organizationId = user?.data?.userBranches?.[1]?.branchId || user?.data?.organization_id

  // Dummy requests data (document and meeting requests) - no backend call
  const allRequests: DocumentRequest[] = useMemo(() => {
    return [
      {
        id: 1,
        project_reference_id: 'PROJ-2024-001',
        requested_by: 'lender_user_1',
        description: 'We need the detailed project report (DPR) and feasibility study documents to evaluate the project for funding. Please provide the latest versions of these documents.',
        requested_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'active',
        project: {
          id: 101,
          title: 'Smart City Infrastructure Development',
          organization_id: organizationId || 'ORG-001'
        }
      },
      {
        id: 2,
        project_reference_id: 'PROJ-2024-002',
        requested_by: 'lender_user_2',
        description: 'Requesting budget approval documents and compliance certificates for project PROJ-2024-002. These documents are required for our internal review process.',
        requested_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'active',
        project: {
          id: 102,
          title: 'Water Supply System Upgrade',
          organization_id: organizationId || 'ORG-001'
        }
      },
      {
        id: 3,
        project_reference_id: 'PROJ-2024-003',
        requested_by: 'lender_user_3',
        description: 'Please provide the tender/RFP documents and any additional technical specifications for the project. We are interested in understanding the procurement process.',
        requested_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'completed',
        responded_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        responded_by: 'municipality_user',
        project: {
          id: 103,
          title: 'Road Infrastructure Improvement',
          organization_id: organizationId || 'ORG-001'
        }
      },
      {
        id: 4,
        project_reference_id: 'PROJ-2024-001',
        requested_by: 'lender_user_4',
        description: 'Need updated financial statements and project cost breakdown documents for our due diligence process.',
        requested_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'pending',
        project: {
          id: 101,
          title: 'Smart City Infrastructure Development',
          organization_id: organizationId || 'ORG-001'
        }
      },
      {
        id: 5,
        project_reference_id: 'PROJ-2024-004',
        requested_by: 'lender_user_5',
        description: 'Requesting environmental clearance certificates and land acquisition documents for project evaluation.',
        requested_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'completed',
        responded_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        responded_by: 'municipality_user',
        project: {
          id: 104,
          title: 'Waste Management System',
          organization_id: organizationId || 'ORG-001'
        }
      },
      {
        id: 6,
        project_reference_id: 'PROJ-2024-001',
        requested_by: 'lender_user_6',
        description: 'We would like to schedule a meeting to discuss clarifications beyond Q&A regarding the project implementation timeline and resource allocation.',
        requested_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'meeting',
        status: 'active',
        project: {
          id: 101,
          title: 'Smart City Infrastructure Development',
          organization_id: organizationId || 'ORG-001'
        }
      },
      {
        id: 7,
        project_reference_id: 'PROJ-2024-002',
        requested_by: 'lender_user_7',
        description: 'Requesting a meeting invitation to clarify technical aspects and discuss potential collaboration opportunities.',
        requested_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'meeting',
        status: 'completed',
        responded_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        responded_by: 'municipality_user',
        meeting_scheduled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_link: 'https://zoom.us/j/1234567890',
        project: {
          id: 102,
          title: 'Water Supply System Upgrade',
          organization_id: organizationId || 'ORG-001'
        }
      },
      {
        id: 8,
        project_reference_id: 'PROJ-2024-003',
        requested_by: 'lender_user_8',
        description: 'We need additional clarification meeting to discuss project milestones and deliverables in detail.',
        requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'meeting',
        status: 'pending',
        project: {
          id: 103,
          title: 'Road Infrastructure Improvement',
          organization_id: organizationId || 'ORG-001'
        }
      }
    ]
  }, [organizationId])

  const isLoading = false
  const isError = false
  const error = null

  // Filter requests by status and search query
  const requestsByStatus = useMemo(() => {
    // First filter by search query
    const filteredBySearch = allRequests.filter(req => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase().trim()
      return req.project_reference_id?.toLowerCase().includes(query) ||
             req.description?.toLowerCase().includes(query) ||
             req.requested_by?.toLowerCase().includes(query) ||
             req.project?.title?.toLowerCase().includes(query)
    })

    const all = filteredBySearch
    const active = filteredBySearch.filter(req => 
      req.status?.toLowerCase() === 'pending' || 
      req.status?.toLowerCase() === 'active'
    )
    const completed = filteredBySearch.filter(req => 
      req.status?.toLowerCase() === 'completed'
    )
    
    return { all, active, completed }
  }, [allRequests, searchQuery])

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'active':
        return 'default'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const handleUploadDocument = (requestId: number, projectReferenceId: string) => {
    navigate(`/main/municipal/document-requests/${requestId}/upload`, {
      state: { projectReferenceId }
    })
  }


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Spinner size={24} />
            <span className="text-muted-foreground">Loading document requests...</span>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "Failed to load document requests. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents & Meetings</h1>
          <p className="text-muted-foreground mt-1">
            View and respond to document requests and meeting requests from lenders
          </p>
        </div>
      </div>

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <TabsList className="grid w-full sm:w-auto sm:max-w-2xl grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Requests
            {requestsByStatus.all.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {requestsByStatus.all.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Active
            {requestsByStatus.active.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {requestsByStatus.active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            Completed
            {requestsByStatus.completed.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {requestsByStatus.completed.length}
              </Badge>
            )}
          </TabsTrigger>
          </TabsList>
          <div className="flex gap-2 w-full sm:w-auto sm:min-w-[350px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by project reference ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Search is already handled by onChange, but we can add explicit search action here if needed
                  }
                }}
                className="pl-9 pr-3"
              />
            </div>
            <Button 
              variant="default"
              className="shrink-0"
              onClick={() => {
                // Search is already live, but button provides visual feedback
                // You can add additional search logic here if needed
              }}
            >
              Search
            </Button>
          </div>
        </div>

        {/* All Requests Tab */}
        <TabsContent value="all" className="space-y-4">
          {requestsByStatus.all.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Requests</CardTitle>
                <CardDescription>
                  You don't have any document or meeting requests yet.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requestsByStatus.all.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                        {request.project?.title || `Request #${request.id}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={getStatusBadgeVariant(request.status)}
                          className={
                            request.status === 'active' || request.status === 'pending'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                              : request.status === 'completed'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                              : ''
                          }
                        >
                          {request.status}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            request.request_type === 'document'
                              ? 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400'
                              : 'border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400'
                          }
                        >
                          {request.request_type === 'document' ? (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              Document
                            </>
                          ) : (
                            <>
                              <Video className="h-3 w-3 mr-1" />
                              Meeting
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span className="truncate font-medium">{request.project_reference_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        <span>Requested by: <span className="font-medium">{request.requested_by}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        <span>Requested: {formatDate(request.requested_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2 pl-1 border-l-2 border-l-gray-200 dark:border-l-gray-700">
                        {request.description}
                      </p>
                    </div>
                    {(request.status === 'pending' || request.status === 'active') && (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={() => handleUploadDocument(request.id, request.project_reference_id)}
                      >
                        {request.request_type === 'document' ? (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Document
                          </>
                        ) : (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            Schedule Meeting
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Requests Tab */}
        <TabsContent value="active" className="space-y-4">
          {requestsByStatus.active.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Active Requests</CardTitle>
                <CardDescription>
                  You don't have any active requests.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requestsByStatus.active.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                        {request.project?.title || `Request #${request.id}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={getStatusBadgeVariant(request.status)}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {request.status}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            request.request_type === 'document'
                              ? 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400'
                              : 'border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400'
                          }
                        >
                          {request.request_type === 'document' ? (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              Document
                            </>
                          ) : (
                            <>
                              <Video className="h-3 w-3 mr-1" />
                              Meeting
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span className="truncate font-medium">{request.project_reference_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        <span>Requested by: <span className="font-medium">{request.requested_by}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        <span>Requested: {formatDate(request.requested_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2 pl-1 border-l-2 border-l-gray-200 dark:border-l-gray-700">
                        {request.description}
                      </p>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={() => handleUploadDocument(request.id, request.project_reference_id)}
                    >
                      {request.request_type === 'document' ? (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Requests Tab */}
        <TabsContent value="completed" className="space-y-4">
          {requestsByStatus.completed.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Completed Requests</CardTitle>
                <CardDescription>
                  You don't have any completed requests yet.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requestsByStatus.completed.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                        {request.project?.title || `Request #${request.id}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={getStatusBadgeVariant(request.status)}
                          className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span className="truncate font-medium">{request.project_reference_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        <span>Requested by: <span className="font-medium">{request.requested_by}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        <span>Requested: {formatDate(request.requested_at)}</span>
                      </div>
                      {request.responded_at && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span>Completed: {formatDate(request.responded_at)}</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2 pl-1 border-l-2 border-l-gray-200 dark:border-l-gray-700">
                        {request.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

