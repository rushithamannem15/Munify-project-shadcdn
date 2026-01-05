import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Building2,
  Calendar,
  MapPin,
  IndianRupee,
  ArrowRight,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { apiService } from '@/services/api'
import { useAuth } from '@/contexts/auth-context'
import { type Project } from '@/features/projects/types'

interface MunicipalityProject extends Project {
  progress_updates_count?: number
  last_update_date?: string
}

const formatCurrency = (amount: string | number | null | undefined) => {
  if (!amount) return "₹0"
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (Number.isNaN(num)) return "₹0"
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)}L`
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(2)}K`
  }
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
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

export default function MunicipalProjectProgress() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  const organizationId = user?.data?.userBranches?.[1]?.branchId || user?.data?.organization_id

  // Fetch projects for the municipality
  const { 
    data: projectsResponse, 
    isLoading, 
    isError, 
    error 
  } = useQuery<any, any>({
    queryKey: ['municipality-projects', organizationId],
    queryFn: async () => {
      if (!organizationId) return { data: [] }
      
      const response = await apiService.get('/projects', {
        organization_id: organizationId,
        skip: 0,
        limit: 1000,
      })
      
      return response?.data || response || []
    },
    enabled: !!organizationId,
  })

  const allProjects: MunicipalityProject[] = useMemo(() => {
    if (!projectsResponse) return []
    return Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.data || []
  }, [projectsResponse])

  // Filter projects by status and search query
  const projectsByStatus = useMemo(() => {
    // First filter by search query (project reference ID)
    const filteredBySearch = allProjects.filter(p => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase().trim()
      return p.project_reference_id?.toLowerCase().includes(query) ||
             p.title?.toLowerCase().includes(query)
    })

    const all = filteredBySearch.filter(p => 
      p.status?.toLowerCase() === 'approved' || 
      p.status?.toLowerCase() === 'live' ||
      p.status?.toLowerCase() === 'active'
    )
    const inProgress = all.filter(p => 
      p.project_stage?.toLowerCase() !== 'completed' &&
      p.project_stage?.toLowerCase() !== 'closed'
    )
    const completed = all.filter(p => 
      p.project_stage?.toLowerCase() === 'completed' ||
      p.project_stage?.toLowerCase() === 'closed'
    )
    
    return { all, inProgress, completed }
  }, [allProjects, searchQuery])

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'live':
      case 'active':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'completed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const handleUpdateProgress = (projectId: number, projectReferenceId: string) => {
    navigate(`/main/municipal/projects/${projectId}/progress/update`, {
      state: { projectReferenceId }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Spinner size={24} />
            <span className="text-muted-foreground">Loading projects...</span>
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
            {error?.message || "Failed to load projects. Please try again."}
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
          <h1 className="text-3xl font-bold">Project Progress Management</h1>
          <p className="text-muted-foreground mt-1">
            View and update progress for your municipality projects
          </p>
        </div>
      </div>

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <TabsList className="grid w-full sm:w-auto sm:max-w-2xl grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            All Projects
            {projectsByStatus.all.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {projectsByStatus.all.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inProgress" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            In Progress
            {projectsByStatus.inProgress.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {projectsByStatus.inProgress.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            Completed
            {projectsByStatus.completed.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {projectsByStatus.completed.length}
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

        {/* All Projects Tab */}
        <TabsContent value="all" className="space-y-4">
          {projectsByStatus.all.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Projects Found</CardTitle>
                <CardDescription>
                  You don't have any active projects yet.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectsByStatus.all.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500">
                  <CardHeader className="pb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={getStatusBadgeVariant(project.status)}
                          className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300"
                        >
                          {project.status}
                        </Badge>
                        {project.project_stage && (
                          <Badge variant="outline" className="border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400">
                            {project.project_stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="truncate font-medium">{project.project_reference_id}</span>
                      </div>
                      {project.state && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3.5 w-3.5 text-red-500" />
                          <span>{project.city ? `${project.city}, ` : ''}{project.state}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IndianRupee className="h-3.5 w-3.5 text-green-500" />
                        <span>Requirement: <span className="font-medium">{formatCurrency(project.funding_requirement)}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        <span>Created: {formatDate(project.created_at)}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                      onClick={() => handleUpdateProgress(project.id, project.project_reference_id)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Update Progress
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="inProgress" className="space-y-4">
          {projectsByStatus.inProgress.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No In-Progress Projects</CardTitle>
                <CardDescription>
                  You don't have any projects currently in progress.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectsByStatus.inProgress.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={getStatusBadgeVariant(project.status)}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {project.status}
                        </Badge>
                        {project.project_stage && (
                          <Badge variant="outline" className="border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400">
                            {project.project_stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span className="truncate font-medium">{project.project_reference_id}</span>
                      </div>
                      {project.state && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3.5 w-3.5 text-red-500" />
                          <span>{project.city ? `${project.city}, ` : ''}{project.state}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IndianRupee className="h-3.5 w-3.5 text-green-500" />
                        <span>Requirement: <span className="font-medium">{formatCurrency(project.funding_requirement)}</span></span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={() => handleUpdateProgress(project.id, project.project_reference_id)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Update Progress
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-4">
          {projectsByStatus.completed.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Completed Projects</CardTitle>
                <CardDescription>
                  You don't have any completed projects yet.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectsByStatus.completed.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={getStatusBadgeVariant(project.status)}
                          className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {project.status}
                        </Badge>
                        {project.project_stage && (
                          <Badge variant="outline" className="border-green-300 text-green-600 dark:border-green-700 dark:text-green-400">
                            {project.project_stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="h-3.5 w-3.5 text-green-500" />
                        <span className="truncate font-medium">{project.project_reference_id}</span>
                      </div>
                      {project.state && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3.5 w-3.5 text-red-500" />
                          <span>{project.city ? `${project.city}, ` : ''}{project.state}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <IndianRupee className="h-3.5 w-3.5 text-green-500" />
                        <span>Requirement: <span className="font-medium">{formatCurrency(project.funding_requirement)}</span></span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white" 
                      onClick={() => handleUpdateProgress(project.id, project.project_reference_id)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Progress
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
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

