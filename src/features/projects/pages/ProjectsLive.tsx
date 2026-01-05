import { useEffect, useState, useMemo, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useNavigate } from "react-router-dom"
import { apiService } from "@/services/api"
import { alerts } from "@/lib/alerts"
import ProjectFiltersAdvanced, { type ProjectFiltersState } from "@/components/ProjectFiltersAdvanced"
import { FundingCommitmentDialog } from "@/features/projects/components/FundingCommitmentDialog"
import { type Project, LIVE_PROJECTS_QUERY_KEY } from "@/features/projects/types"
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock,
  Star,
  Eye,
  Heart,
  IndianRupee,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
  FolderKanban
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"

// Format currency with appropriate scale (Cr, L, K, or plain rupees)
const formatCurrency = (amount: number): string => {
  if (amount === 0) return "₹0"
  
  if (amount >= 10000000) {
    // Crores (1 Cr = 10,000,000)
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  } else if (amount >= 100000) {
    // Lakhs (1 L = 100,000)
    return `₹${(amount / 100000).toFixed(2)}L`
  } else if (amount >= 1000) {
    // Thousands (1 K = 1,000)
    return `₹${(amount / 1000).toFixed(2)}K`
  } else {
    // Plain rupees
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }
}

export default function ProjectsLive() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [fundingDialog, setFundingDialog] = useState<{ open: boolean; project_reference_id: string | null }>({ open: false, project_reference_id: null })
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  
  // Filter state for UI (temporary changes before applying)
  const [filters, setFilters] = useState<ProjectFiltersState>({
    project_referenceid: "",
    location: "",
    project_category: "",
    project_stage: "",
    status: "",
    credit_score: "",
    funding_type: "",
    mode_of_implementation: "",
    ownership: "",
    fund_requirement: [0, 1000],
    commitment_gap: [0, 500],
    project_cost: [0, 2000]
  })

  // Applied filters state (used for API calls)
  const [appliedFilters, setAppliedFilters] = useState<ProjectFiltersState>({
    project_referenceid: "",
    location: "",
    project_category: "",
    project_stage: "",
    status: "",
    credit_score: "",
    funding_type: "",
    mode_of_implementation: "",
    ownership: "",
    fund_requirement: [0, 1000],
    commitment_gap: [0, 500],
    project_cost: [0, 2000]
  })

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const buildProjectQueryParams = (currentFilters: ProjectFiltersState, valueRanges: any) => {
    const queryParams: any = {
      skip: 0,
      limit: 10,
      // Backend expects lowercase status, default to active list
      status: "active",
      user_id: user?.data?.login,
    }

    // Add search parameter (project_referenceid)
    if (currentFilters.project_referenceid) {
      queryParams.search = currentFilters.project_referenceid
    }

    // Add location (state) filter
    if (currentFilters.location) {
      queryParams.states = currentFilters.location
    }

    // Add project category filter
    if (currentFilters.project_category) {
      queryParams.categories = currentFilters.project_category
    }

    // Add project stage filter
    if (currentFilters.project_stage) {
      queryParams.project_stage = currentFilters.project_stage
    }

    // Add status filter (override default active if user selected)
    if (currentFilters.status) {
      queryParams.status = currentFilters.status.toLowerCase()
    }

    // Add credit score filter
    if (currentFilters.credit_score) {
      queryParams.municipality_credit_rating = currentFilters.credit_score
    }

    // Add funding type filter
    if (currentFilters.funding_type) {
      queryParams.funding_type = currentFilters.funding_type
    }

    // Add mode of implementation filter
    if (currentFilters.mode_of_implementation) {
      queryParams.mode_of_implementation = currentFilters.mode_of_implementation
    }

    // Add ownership filter
    if (currentFilters.ownership) {
      queryParams.ownership = currentFilters.ownership
    }

    // Add fund requirement range (convert crores to rupees: 1 crore = 10,000,000)
    if (
      currentFilters.fund_requirement[0] > valueRanges.fund_requirement.min ||
      currentFilters.fund_requirement[1] < valueRanges.fund_requirement.max
    ) {
      queryParams.min_funding_requirement = currentFilters.fund_requirement[0] * 10000000
      queryParams.max_funding_requirement = currentFilters.fund_requirement[1] * 10000000
    }

    // Add commitment gap range (convert crores to rupees)
    if (
      currentFilters.commitment_gap[0] > valueRanges.commitment_gap.min ||
      currentFilters.commitment_gap[1] < valueRanges.commitment_gap.max
    ) {
      queryParams.min_commitment_gap = currentFilters.commitment_gap[0] * 10000000
      queryParams.max_commitment_gap = currentFilters.commitment_gap[1] * 10000000
    }

    // Add project cost range (convert crores to rupees)
    if (
      currentFilters.project_cost[0] > valueRanges.project_cost.min ||
      currentFilters.project_cost[1] < valueRanges.project_cost.max
    ) {
      queryParams.min_total_project_cost = currentFilters.project_cost[0] * 10000000
      queryParams.max_total_project_cost = currentFilters.project_cost[1] * 10000000
    }

    return queryParams
  }

  // Query for value ranges (min/max for sliders)
  const { data: valueRangesResponse } = useQuery({
    queryKey: ["project-value-ranges"],
    queryFn: () => apiService.get("/projects/value-ranges"),
    retry: false,
  })

  // Extract range values from API and convert to crores if needed
  const valueRanges = useMemo(() => {
    if (!valueRangesResponse) {
      return {
        fund_requirement: { min: 0, max: 1000 },
        commitment_gap: { min: 0, max: 500 },
        project_cost: { min: 0, max: 2000 },
      }
    }
    const data = Array.isArray(valueRangesResponse)
      ? valueRangesResponse[0]
      : (valueRangesResponse as any)?.data || valueRangesResponse
    
    // Helper function to parse string/number and convert to crores (divide by 10,000,000)
    const toCrores = (value: string | number | undefined, defaultValue: number = 0): number => {
      if (value === undefined || value === null) return defaultValue
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(numValue)) return defaultValue
      // Convert from rupees to crores (1 crore = 10,000,000)
      return Math.round((numValue / 10000000) * 100) / 100 // Round to 2 decimal places
    }

    const fundReqMin = toCrores(
      data?.min_funding_requirement || data?.fund_requirement_min || data?.min_fund_requirement,
      0
    )
    const fundReqMax = toCrores(
      data?.max_funding_requirement || data?.fund_requirement_max || data?.max_fund_requirement,
      1000
    )
    const commitGapMin = toCrores(
      data?.min_commitment_gap || data?.commitment_gap_min || data?.min_commitment_gap,
      0
    )
    const commitGapMax = toCrores(
      data?.max_commitment_gap || data?.commitment_gap_max || data?.max_commitment_gap,
      500
    )
    const projCostMin = toCrores(
      data?.min_total_project_cost || data?.project_cost_min || data?.min_project_cost,
      0
    )
    const projCostMax = toCrores(
      data?.max_total_project_cost || data?.project_cost_max || data?.max_project_cost,
      2000
    )

    return {
      fund_requirement: {
        min: fundReqMin,
        max: fundReqMax,
      },
      commitment_gap: {
        min: commitGapMin,
        max: commitGapMax,
      },
      project_cost: {
        min: projCostMin,
        max: projCostMax,
      },
    }
  }, [valueRangesResponse])

  const {
    data: projectsResponse,
    isLoading,
    isError,
    error,
  } = useQuery<any, any>({
    queryKey: [...LIVE_PROJECTS_QUERY_KEY, { filters: appliedFilters }],
    queryFn: () => apiService.get("/projects", buildProjectQueryParams(appliedFilters, valueRanges)),
  })

  const projects = useMemo<Project[]>(() => projectsResponse?.data ?? [], [projectsResponse])

  // Extract unique values from projects for dropdown options
  const filterOptions = useMemo(() => {
    const states = Array.from(new Set(projects.map(p => p.state).filter(Boolean))).sort()
    const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean))).sort()
    const stages = Array.from(new Set(projects.map(p => p.project_stage).filter(Boolean))).sort()
    const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean))).sort()
    const creditScores = Array.from(new Set(projects.map(p => p.municipality_credit_rating).filter(Boolean))).sort()
    const fundingTypes = Array.from(new Set(projects.map(p => (p as any).funding_type).filter(Boolean))).sort()
    const modes = Array.from(new Set(projects.map(p => (p as any).mode_of_implementation).filter(Boolean))).sort()
    const ownerships = Array.from(new Set(projects.map(p => (p as any).ownership).filter(Boolean))).sort()

    return {
      states: states.map(s => ({ value: s, label: s })),
      categories: categories.map(c => ({ value: c, label: c })),
      stages: stages.map(s => ({ value: s, label: s })),
      statuses: statuses.map(s => ({ value: s, label: s })),
      creditScores: creditScores.map(c => ({ value: c, label: c })),
      fundingTypes: fundingTypes.map(f => ({ value: f, label: f })),
      modes: modes.map(m => ({ value: m, label: m })),
      ownerships: ownerships.map(o => ({ value: o, label: o })),
    }
  }, [projects])

  // Count active filters for UI display (only range filters) - based on applied filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    const fundReqMin = valueRanges?.fund_requirement?.min ?? 0
    const fundReqMax = valueRanges?.fund_requirement?.max ?? 1000
    const commitGapMin = valueRanges?.commitment_gap?.min ?? 0
    const commitGapMax = valueRanges?.commitment_gap?.max ?? 500
    const projCostMin = valueRanges?.project_cost?.min ?? 0
    const projCostMax = valueRanges?.project_cost?.max ?? 2000
    
    if (appliedFilters.fund_requirement[0] > fundReqMin || appliedFilters.fund_requirement[1] < fundReqMax) count++
    if (appliedFilters.commitment_gap[0] > commitGapMin || appliedFilters.commitment_gap[1] < commitGapMax) count++
    if (appliedFilters.project_cost[0] > projCostMin || appliedFilters.project_cost[1] < projCostMax) count++
    return count
  }, [appliedFilters, valueRanges])

  // Count all active filters (including basic ones) - based on applied filters
  const totalActiveFiltersCount = useMemo(() => {
    let count = 0
    if (appliedFilters.project_referenceid) count++
    if (appliedFilters.location) count++
    if (appliedFilters.project_category) count++
    if (appliedFilters.project_stage) count++
    if (appliedFilters.status) count++
    if (appliedFilters.credit_score) count++
    if (appliedFilters.funding_type) count++
    if (appliedFilters.mode_of_implementation) count++
    if (appliedFilters.ownership) count++
    
    const fundReqMin = valueRanges?.fund_requirement?.min ?? 0
    const fundReqMax = valueRanges?.fund_requirement?.max ?? 1000
    const commitGapMin = valueRanges?.commitment_gap?.min ?? 0
    const commitGapMax = valueRanges?.commitment_gap?.max ?? 500
    const projCostMin = valueRanges?.project_cost?.min ?? 0
    const projCostMax = valueRanges?.project_cost?.max ?? 2000
    
    if (appliedFilters.fund_requirement[0] > fundReqMin || appliedFilters.fund_requirement[1] < fundReqMax) count++
    if (appliedFilters.commitment_gap[0] > commitGapMin || appliedFilters.commitment_gap[1] < commitGapMax) count++
    if (appliedFilters.project_cost[0] > projCostMin || appliedFilters.project_cost[1] < projCostMax) count++
    return count
  }, [appliedFilters, valueRanges])

  const handleFiltersChange = (newFilters: ProjectFiltersState) => {
    setFilters(newFilters)
  }

  const debouncedSearch = useCallback((searchValue: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, project_referenceid: searchValue }))
    }, 500) // 500ms delay

    setSearchTimeout(timeout)
  }, [searchTimeout])

  const handleClearFilters = () => {
    const clearedFilters: ProjectFiltersState = {
      project_referenceid: "",
      location: "",
      project_category: "",
      project_stage: "",
      status: "",
      credit_score: "",
      funding_type: "",
      mode_of_implementation: "",
      ownership: "",
      fund_requirement: [valueRanges?.fund_requirement?.min ?? 0, valueRanges?.fund_requirement?.max ?? 1000] as [number, number],
      commitment_gap: [valueRanges?.commitment_gap?.min ?? 0, valueRanges?.commitment_gap?.max ?? 500] as [number, number],
      project_cost: [valueRanges?.project_cost?.min ?? 0, valueRanges?.project_cost?.max ?? 2000] as [number, number],
    }
    setFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    setAdvancedFiltersOpen(false)
  }

  // Update filter ranges when valueRanges are loaded
  useEffect(() => {
    if (valueRanges && (valueRanges.fund_requirement.max > 0 || valueRanges.commitment_gap.max > 0 || valueRanges.project_cost.max > 0)) {
      const updatedFilters = {
        fund_requirement: [
          valueRanges.fund_requirement.min,
          valueRanges.fund_requirement.max
        ] as [number, number],
        commitment_gap: [
          valueRanges.commitment_gap.min,
          valueRanges.commitment_gap.max
        ] as [number, number],
        project_cost: [
          valueRanges.project_cost.min,
          valueRanges.project_cost.max
        ] as [number, number],
      }
      setFilters(prev => ({
        ...prev,
        ...updatedFilters
      }))
      setAppliedFilters(prev => ({
        ...prev,
        ...updatedFilters
      }))
    }
  }, [valueRanges])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const handleViewDetails = (projectId: number) => {
    navigate(`/main/projects/${projectId}`)
  }

  const handleViewQA = (projectId: number) => {
    navigate(`/main/projects/${projectId}#qa`)
  }

  const handleFundProject = (project: Project) => {
    if (!project.project_reference_id) {
      alerts.error("Validation Error", "Project reference ID not found")
      return
    }
    setFundingDialog({ open: true, project_reference_id: project.project_reference_id })
  }

  // Mutation for adding project to favorites
  const addToFavoritesMutation = useMutation({
    mutationFn: (data: { project_reference_id: string; organization_id: string; user_id: string; created_by: string }) =>
      apiService.post("/project-favorites/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVE_PROJECTS_QUERY_KEY })
      alerts.success("Success", "Project added to favorites successfully")
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.response?.data?.detail || "Failed to add project to favorites. Please try again."
      alerts.error("Error", message)
    },
  })

  // Mutation for removing project from favorites
  const removeFromFavoritesMutation = useMutation({
    mutationFn: ({ project_reference_id, user_id }: { project_reference_id: string; user_id: string }) => {
      const params = new URLSearchParams({
        project_reference_id,
        user_id
      })
      return apiService.delete(`/project-favorites/?${params.toString()}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVE_PROJECTS_QUERY_KEY })
      alerts.success("Success", "Project removed from favorites successfully")
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.response?.data?.detail || "Failed to remove project from favorites. Please try again."
      alerts.error("Error", message)
    },
  })

  const handleToggleFavorites = (project: Project) => {
    const projectReferenceId = project.project_reference_id

    if (!projectReferenceId) {
      alerts.error("Validation Error", "Project reference ID not found")
      return
    }

    const userId = user?.data?.login // TODO: Get from auth context
    const isFavorited = Boolean(project.is_favorite)

    if (isFavorited) {
      // Remove from favorites
      removeFromFavoritesMutation.mutate({
        project_reference_id: projectReferenceId.toString(),
        user_id: userId
      })
    } else {
      // Add to favorites
      addToFavoritesMutation.mutate({
        project_reference_id: projectReferenceId.toString(),
        organization_id: project.organization_id,
        user_id: userId,
        created_by: userId
      })
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Projects</h1>
          <p className="text-muted-foreground">
            Explore ongoing municipal projects seeking funding
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Sheet open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </SheetTitle>
                <SheetDescription>
                  Fine-tune your search with advanced filtering options
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ProjectFiltersAdvanced
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  locationOptions={filterOptions.states}
                  categoryOptions={filterOptions.categories}
                  stageOptions={filterOptions.stages}
                  statusOptions={filterOptions.statuses}
                  creditScoreOptions={filterOptions.creditScores}
                  fundingTypeOptions={filterOptions.fundingTypes}
                  modeOfImplementationOptions={filterOptions.modes}
                  ownershipOptions={filterOptions.ownerships}
                  fundRequirementRange={valueRanges?.fund_requirement}
                  commitmentGapRange={valueRanges?.commitment_gap}
                  projectCostRange={valueRanges?.project_cost}
                  hideSearchField={true}
                  hideCardWrapper={true}
                  showOnlyRangeFilters={true}
                />
              </div>
              <div className="flex flex-col gap-3 mt-8 pt-6 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    className="flex-1"
                    disabled={totalActiveFiltersCount === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button 
                    onClick={handleApplyFilters}
                    className="flex-1"
                  >
                    Apply Filters
                  </Button>
                </div>
                {totalActiveFiltersCount > 0 && (
                  <div className="text-sm text-muted-foreground text-center">
                    {totalActiveFiltersCount} filter{totalActiveFiltersCount !== 1 ? 's' : ''} active
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" onClick={() => navigate("/main/projects/my")}>
            <FolderKanban className="h-4 w-4 mr-2" />
            My Projects
          </Button>
          <Button onClick={() => navigate("/main/projects/favorites")}>
            <Star className="h-4 w-4 mr-2" />
            My Favorites
          </Button>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search by project reference ID..." 
                    className="pl-10"
                    value={filters.project_referenceid}
                    onChange={(e) => {
                      const newSearch = e.target.value
                      setFilters(prev => ({ ...prev, project_referenceid: newSearch }))
                      // Update applied filters immediately for search (no need to wait for Apply button)
                      setAppliedFilters(prev => ({ ...prev, project_referenceid: newSearch }))
                      debouncedSearch(newSearch)
                    }}
                  />
                  {filters.project_referenceid && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, project_referenceid: "" }))
                      setAppliedFilters(prev => ({ ...prev, project_referenceid: "" }))
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {totalActiveFiltersCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {projects.length} projects found
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Selection Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
              </div>
              
              {/* Primary Filters Row - First line with 5 filters + Show More button */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Location (State) */}
                {filterOptions.states.length > 0 && (
                  <Select 
                    value={appliedFilters.location || "all"} 
                    onValueChange={(value) => {
                      const newValue = value === "all" ? "" : value
                      setFilters(prev => ({ ...prev, location: newValue }))
                      setAppliedFilters(prev => ({ ...prev, location: newValue }))
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {filterOptions.states.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Project Category */}
                {filterOptions.categories.length > 0 && (
                  <Select 
                    value={appliedFilters.project_category || "all"} 
                    onValueChange={(value) => {
                      const newValue = value === "all" ? "" : value
                      setFilters(prev => ({ ...prev, project_category: newValue }))
                      setAppliedFilters(prev => ({ ...prev, project_category: newValue }))
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Project Stage */}
                {filterOptions.stages.length > 0 && (
                  <Select 
                    value={appliedFilters.project_stage || "all"} 
                    onValueChange={(value) => {
                      const newValue = value === "all" ? "" : value
                      setFilters(prev => ({ ...prev, project_stage: newValue }))
                      setAppliedFilters(prev => ({ ...prev, project_stage: newValue }))
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {filterOptions.stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Credit Score */}
                {filterOptions.creditScores.length > 0 && (
                  <Select 
                    value={appliedFilters.credit_score || "all"} 
                    onValueChange={(value) => {
                      const newValue = value === "all" ? "" : value
                      setFilters(prev => ({ ...prev, credit_score: newValue }))
                      setAppliedFilters(prev => ({ ...prev, credit_score: newValue }))
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="All Credit Scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Credit Scores</SelectItem>
                      {filterOptions.creditScores.map((score) => (
                        <SelectItem key={score.value} value={score.value}>
                          {score.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Funding Type */}
                {filterOptions.fundingTypes.length > 0 && (
                  <Select 
                    value={appliedFilters.funding_type || "all"} 
                    onValueChange={(value) => {
                      const newValue = value === "all" ? "" : value
                      setFilters(prev => ({ ...prev, funding_type: newValue }))
                      setAppliedFilters(prev => ({ ...prev, funding_type: newValue }))
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="All Funding Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Funding Types</SelectItem>
                      {filterOptions.fundingTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Show More Button - Show when there are additional filters */}
                {(filterOptions.modes.length > 0 || filterOptions.ownerships.length > 0) && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowMoreFilters(!showMoreFilters)}
                    className="h-9 px-3 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/50 shrink-0 border border-transparent hover:border-border transition-all"
                  >
                    <span className="flex items-center gap-1.5">
                      {showMoreFilters ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          <span>Show More</span>
                        </>
                      )}
                    </span>
                  </Button>
                )}
              </div>

              {/* Secondary Filters Row (shown when showMoreFilters is true) */}
              {showMoreFilters && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t">

                  {/* Mode of Implementation */}
                  {filterOptions.modes.length > 0 && (
                    <Select 
                      value={appliedFilters.mode_of_implementation || "all"} 
                      onValueChange={(value) => {
                        const newValue = value === "all" ? "" : value
                        setFilters(prev => ({ ...prev, mode_of_implementation: newValue }))
                        setAppliedFilters(prev => ({ ...prev, mode_of_implementation: newValue }))
                      }}
                    >
                      <SelectTrigger className="w-[200px] h-9">
                        <SelectValue placeholder="All Modes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        {filterOptions.modes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Ownership */}
                  {filterOptions.ownerships.length > 0 && (
                    <Select 
                      value={appliedFilters.ownership || "all"} 
                      onValueChange={(value) => {
                        const newValue = value === "all" ? "" : value
                        setFilters(prev => ({ ...prev, ownership: newValue }))
                        setAppliedFilters(prev => ({ ...prev, ownership: newValue }))
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="All Ownership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ownership</SelectItem>
                        {filterOptions.ownerships.map((ownership) => (
                          <SelectItem key={ownership.value} value={ownership.value}>
                            {ownership.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Active Filter Indicators */}
              {(appliedFilters.location || appliedFilters.project_category || 
                appliedFilters.project_stage || appliedFilters.credit_score || appliedFilters.funding_type || 
                appliedFilters.mode_of_implementation || appliedFilters.ownership) && (
                <div className="flex items-center gap-1 flex-wrap">
                  {appliedFilters.location && (
                    <Badge variant="secondary" className="text-xs">
                      {filterOptions.states.find(s => s.value === appliedFilters.location)?.label || appliedFilters.location}
                    </Badge>
                  )}
                  {appliedFilters.project_category && (
                    <Badge variant="secondary" className="text-xs">
                      {filterOptions.categories.find(c => c.value === appliedFilters.project_category)?.label || appliedFilters.project_category}
                    </Badge>
                  )}
                  {appliedFilters.project_stage && (
                    <Badge variant="secondary" className="text-xs">
                      {filterOptions.stages.find(s => s.value === appliedFilters.project_stage)?.label || appliedFilters.project_stage}
                    </Badge>
                  )}
                  {appliedFilters.credit_score && (
                    <Badge variant="secondary" className="text-xs">
                      Credit: {filterOptions.creditScores.find(c => c.value === appliedFilters.credit_score)?.label || appliedFilters.credit_score}
                    </Badge>
                  )}
                  {appliedFilters.funding_type && (
                    <Badge variant="secondary" className="text-xs">
                      {filterOptions.fundingTypes.find(f => f.value === appliedFilters.funding_type)?.label || appliedFilters.funding_type}
                    </Badge>
                  )}
                  {appliedFilters.mode_of_implementation && (
                    <Badge variant="secondary" className="text-xs">
                      {filterOptions.modes.find(m => m.value === appliedFilters.mode_of_implementation)?.label || appliedFilters.mode_of_implementation}
                    </Badge>
                  )}
                  {appliedFilters.ownership && (
                    <Badge variant="secondary" className="text-xs">
                      {filterOptions.ownerships.find(o => o.value === appliedFilters.ownership)?.label || appliedFilters.ownership}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">Loading projects...</div>
      )}
      {isError && (
        <div className="text-center text-sm text-red-500">
          {(error as any)?.response?.data?.message || (error as Error)?.message || "Failed to load projects"}
        </div>
      )}
      {!isLoading && !isError && projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-sm">
              {totalActiveFiltersCount > 0 
                ? "Try adjusting your filters to see more projects"
                : "No projects are currently available"
              }
            </p>
          </div>
          {totalActiveFiltersCount > 0 && (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const image = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop"
          const name = p.title
          const municipality = p.city || p.organization_id || "—"
          const state = p.state
          const category = p.category
          const description = p.description
          const totalCommittedAmount = Number((p as any).total_committed_amount || 0)
          const commitmentGap = p.commitment_gap != null ? Number(p.commitment_gap) : null
          // Calculate progress: commitment_gap is the total funding target, total_committed_amount is what's raised
          // Progress = (total_committed_amount / commitment_gap) * 100
          // Example: If commitment_gap = 100 Cr and total_committed_amount = 50 Cr, then 50% is raised
          const progress = commitmentGap !== null && !Number.isNaN(commitmentGap) && commitmentGap > 0
            ? Math.min(100, Math.max(0, Math.round((totalCommittedAmount / commitmentGap) * 100)))
            : 0
          const end = p.end_date ? new Date(p.end_date) : null
          const today = new Date()
          const msLeft = end ? end.getTime() - today.getTime() : 0
          const daysLeft = end ? Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24))) : 0
          const status = p.status
          const id = p.id

          return (
          <Card key={id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={image} 
                alt={name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-green-600 text-white">
                  {status}
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{municipality}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{p.favorite_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>{state}</span>
                  </CardDescription>
                </div>
                <Badge variant="outline">{category}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 flex flex-col">
              <div className="space-y-4 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
                
                {/* Funding Progress */}
                <div className="space-y-3">
                  {/* Funding Target - Highlighted */}
                  {commitmentGap !== null && !Number.isNaN(commitmentGap) && commitmentGap > 0 && (
                    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50">
                            <IndianRupee className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Funding Target</p>
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                              {formatCurrency(commitmentGap)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold">
                          Goal
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-semibold text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5 bg-secondary" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>{formatCurrency(totalCommittedAmount)} raised</span>
                      </span>
                      {commitmentGap !== null && !Number.isNaN(commitmentGap) && (
                        <span className="text-muted-foreground/70">
                          {formatCurrency(Math.max(0, commitmentGap - totalCommittedAmount))} remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{daysLeft} days left</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button 
                  className="flex-1" 
                  onClick={() => handleFundProject(p)}
                >
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Fund Project
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleViewDetails(id)}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleViewQA(id)}
                  title="View Q&A"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  title={p.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                  onClick={() => handleToggleFavorites(p)}
                  disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                  className={p.is_favorite ? "bg-red-50 hover:bg-red-100" : ""}
                >
                  <Heart 
                    className={`h-4 w-4 ${p.is_favorite ? "fill-red-500 text-red-500" : ""}`} 
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Projects
        </Button>
      </div>

      <FundingCommitmentDialog
        open={fundingDialog.open}
        project_reference_id={fundingDialog.project_reference_id}
        onClose={() => setFundingDialog({ open: false, project_reference_id: null })}
      />
    </div>
  )
}
