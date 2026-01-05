import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X, IndianRupee, TrendingUp, Building2 } from "lucide-react"

export interface ProjectFiltersState {
  // Search
  project_referenceid: string
  
  // Dropdown filters
  location: string // state
  project_category: string
  project_stage: string
  status: string
  credit_score: string
  funding_type: string
  mode_of_implementation: string
  ownership: string
  
  // Range filters
  fund_requirement: [number, number]
  commitment_gap: [number, number]
  project_cost: [number, number]
}

export interface ProjectFiltersAdvancedProps {
  filters: ProjectFiltersState
  onFiltersChange: (filters: ProjectFiltersState) => void
  onClearFilters?: () => void
  // Options for dropdowns
  locationOptions?: Array<{ value: string; label: string }>
  categoryOptions?: Array<{ value: string; label: string }>
  stageOptions?: Array<{ value: string; label: string }>
  statusOptions?: Array<{ value: string; label: string }>
  creditScoreOptions?: Array<{ value: string; label: string }>
  fundingTypeOptions?: Array<{ value: string; label: string }>
  modeOfImplementationOptions?: Array<{ value: string; label: string }>
  ownershipOptions?: Array<{ value: string; label: string }>
  // Range defaults
  fundRequirementRange?: { min: number; max: number }
  commitmentGapRange?: { min: number; max: number }
  projectCostRange?: { min: number; max: number }
  className?: string
  hideSearchField?: boolean
  hideCardWrapper?: boolean
  showOnlyRangeFilters?: boolean
}

const defaultFundRequirementRange = { min: 0, max: 1000 } // in crores
const defaultCommitmentGapRange = { min: 0, max: 500 } // in crores
const defaultProjectCostRange = { min: 0, max: 2000 } // in crores

export default function ProjectFiltersAdvanced({
  filters,
  onFiltersChange,
  onClearFilters,
  locationOptions = [],
  categoryOptions = [],
  stageOptions = [],
  statusOptions = [],
  creditScoreOptions = [],
  fundingTypeOptions = [],
  modeOfImplementationOptions = [],
  ownershipOptions = [],
  fundRequirementRange = defaultFundRequirementRange,
  commitmentGapRange = defaultCommitmentGapRange,
  projectCostRange = defaultProjectCostRange,
  className = "",
  hideSearchField = false,
  hideCardWrapper = false,
  showOnlyRangeFilters = false,
}: ProjectFiltersAdvancedProps) {
  // Helper to clamp range values within min/max bounds
  const clampRangeValue = (value: [number, number], min: number, max: number): [number, number] => {
    return [
      Math.max(min, Math.min(max, value[0])),
      Math.max(min, Math.min(max, value[1]))
    ]
  }

  // Common function to determine if a range should use lakhs (when max < 1 crore)
  const shouldUseLakhs = (range: { min: number; max: number }): boolean => {
    return range.max < 1
  }

  // Common function to convert crores to lakhs for display (1 crore = 100 lakhs)
  const convertToLakhs = (valueInCrores: number): number => {
    return valueInCrores * 100
  }

  // Common function to convert lakhs back to crores for storage
  const convertToCrores = (valueInLakhs: number): number => {
    return valueInLakhs / 100
  }

  // Common function to get display values and unit for a range filter
  const getRangeDisplayConfig = (
    range: { min: number; max: number },
    currentValue: [number, number]
  ) => {
    const useLakhs = shouldUseLakhs(range)
    const displayValue: [number, number] = useLakhs
      ? [convertToLakhs(currentValue[0]), convertToLakhs(currentValue[1])]
      : currentValue
    const displayRange = useLakhs
      ? { min: convertToLakhs(range.min), max: convertToLakhs(range.max) }
      : range
    const unit = useLakhs ? "L" : "Cr"
    const unitLabel = useLakhs ? "Lakhs" : "Crores"
    
    return {
      useLakhs,
      displayValue,
      displayRange,
      unit,
      unitLabel,
    }
  }

  // Get display configs for all range filters
  const fundRequirementConfig = getRangeDisplayConfig(fundRequirementRange, filters.fund_requirement)
  const commitmentGapConfig = getRangeDisplayConfig(commitmentGapRange, filters.commitment_gap)
  const projectCostConfig = getRangeDisplayConfig(projectCostRange, filters.project_cost)

  const updateFilter = (key: keyof ProjectFiltersState, value: any) => {
    let updatedValue = value
    
    // Clamp range filter values to ensure they're within bounds
    if (key === 'fund_requirement' && Array.isArray(value) && value.length === 2) {
      // Convert from lakhs to crores if using lakhs display
      const valueInCrores = fundRequirementConfig.useLakhs
        ? [convertToCrores(value[0]), convertToCrores(value[1])] as [number, number]
        : value as [number, number]
      updatedValue = clampRangeValue(valueInCrores, fundRequirementRange.min, fundRequirementRange.max)
    } else if (key === 'commitment_gap' && Array.isArray(value) && value.length === 2) {
      // Convert from lakhs to crores if using lakhs display
      const valueInCrores = commitmentGapConfig.useLakhs
        ? [convertToCrores(value[0]), convertToCrores(value[1])] as [number, number]
        : value as [number, number]
      updatedValue = clampRangeValue(valueInCrores, commitmentGapRange.min, commitmentGapRange.max)
    } else if (key === 'project_cost' && Array.isArray(value) && value.length === 2) {
      // Convert from lakhs to crores if using lakhs display
      const valueInCrores = projectCostConfig.useLakhs
        ? [convertToCrores(value[0]), convertToCrores(value[1])] as [number, number]
        : value as [number, number]
      updatedValue = clampRangeValue(valueInCrores, projectCostRange.min, projectCostRange.max)
    }
    
    onFiltersChange({ ...filters, [key]: updatedValue })
  }

  const hasActiveFilters = () => {
    return (
      filters.project_referenceid !== "" ||
      filters.location !== "" ||
      filters.project_category !== "" ||
      filters.project_stage !== "" ||
      filters.status !== "" ||
      filters.credit_score !== "" ||
      filters.funding_type !== "" ||
      filters.mode_of_implementation !== "" ||
      filters.ownership !== "" ||
      filters.fund_requirement[0] > fundRequirementRange.min ||
      filters.fund_requirement[1] < fundRequirementRange.max ||
      filters.commitment_gap[0] > commitmentGapRange.min ||
      filters.commitment_gap[1] < commitmentGapRange.max ||
      filters.project_cost[0] > projectCostRange.min ||
      filters.project_cost[1] < projectCostRange.max
    )
  }

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters()
    } else {
      // Default clear behavior
      onFiltersChange({
        project_referenceid: "",
        location: "",
        project_category: "",
        project_stage: "",
        status: "",
        credit_score: "",
        funding_type: "",
        mode_of_implementation: "",
        ownership: "",
        fund_requirement: [fundRequirementRange.min, fundRequirementRange.max],
        commitment_gap: [commitmentGapRange.min, commitmentGapRange.max],
        project_cost: [projectCostRange.min, projectCostRange.max],
      })
    }
  }

  const filterContent = (
    <>
      {/* Search by Project Reference ID */}
      {!hideSearchField && (
        <>
          <div className="space-y-2">
            <Label htmlFor="project_referenceid">Search by Project Reference ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="project_referenceid"
                placeholder="Enter project reference ID"
                value={filters.project_referenceid}
                onChange={(e) => updateFilter("project_referenceid", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Separator />
        </>
      )}

        {/* Dropdown Filters Section */}
        {!showOnlyRangeFilters && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Selection Filters</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location (State) */}
            {locationOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="location">Location (State)</Label>
                <Select
                  value={filters.location || undefined}
                  onValueChange={(value) => updateFilter("location", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Project Category */}
            {categoryOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project_category">Project Category</Label>
                <Select
                  value={filters.project_category || undefined}
                  onValueChange={(value) => updateFilter("project_category", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="project_category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Project Stage */}
            {stageOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project_stage">Project Stage</Label>
                <Select
                  value={filters.project_stage || undefined}
                  onValueChange={(value) => updateFilter("project_stage", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="project_stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            {statusOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || undefined}
                  onValueChange={(value) => updateFilter("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Credit Score */}
            {creditScoreOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="credit_score">Credit Score</Label>
                <Select
                  value={filters.credit_score || undefined}
                  onValueChange={(value) => updateFilter("credit_score", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="credit_score">
                    <SelectValue placeholder="Select credit score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Credit Scores</SelectItem>
                    {creditScoreOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Funding Type */}
            {fundingTypeOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="funding_type">Funding Type</Label>
                <Select
                  value={filters.funding_type || undefined}
                  onValueChange={(value) => updateFilter("funding_type", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="funding_type">
                    <SelectValue placeholder="Select funding type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funding Types</SelectItem>
                    {fundingTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mode of Implementation */}
            {modeOfImplementationOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="mode_of_implementation">Mode of Implementation</Label>
                <Select
                  value={filters.mode_of_implementation || undefined}
                  onValueChange={(value) => updateFilter("mode_of_implementation", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="mode_of_implementation">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    {modeOfImplementationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ownership */}
            {ownershipOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership</Label>
                <Select
                  value={filters.ownership || undefined}
                  onValueChange={(value) => updateFilter("ownership", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="ownership">
                    <SelectValue placeholder="Select ownership" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ownership Types</SelectItem>
                    {ownershipOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        )}

        {!showOnlyRangeFilters && <Separator />}

        {/* Range Filters Section */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Range Filters</Label>

          {/* Fund Requirement Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Fund Requirement (in {fundRequirementConfig.unitLabel})
            </Label>
            <div className="space-y-4">
              <Slider
                value={[
                  Math.max(fundRequirementConfig.displayRange.min, Math.min(fundRequirementConfig.displayRange.max, fundRequirementConfig.displayValue[0] || fundRequirementConfig.displayRange.min)),
                  Math.max(fundRequirementConfig.displayRange.min, Math.min(fundRequirementConfig.displayRange.max, fundRequirementConfig.displayValue[1] || fundRequirementConfig.displayRange.max))
                ]}
                onValueChange={(value) => updateFilter("fund_requirement", value)}
                min={fundRequirementConfig.displayRange.min}
                max={fundRequirementConfig.displayRange.max}
                step={fundRequirementConfig.useLakhs
                  ? Math.max(0.01, (fundRequirementConfig.displayRange.max - fundRequirementConfig.displayRange.min) / 1000)
                  : Math.max(0.1, Math.floor((fundRequirementConfig.displayRange.max - fundRequirementConfig.displayRange.min) / 100))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{fundRequirementConfig.useLakhs ? fundRequirementConfig.displayValue[0].toFixed(2) : fundRequirementConfig.displayValue[0]}{fundRequirementConfig.unit}</span>
                <span>₹{fundRequirementConfig.useLakhs ? fundRequirementConfig.displayValue[1].toFixed(2) : fundRequirementConfig.displayValue[1]}{fundRequirementConfig.unit}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Commitment Gap Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Commitment Gap (in {commitmentGapConfig.unitLabel})
            </Label>
            <div className="space-y-4">
              <Slider
                value={[
                  Math.max(commitmentGapConfig.displayRange.min, Math.min(commitmentGapConfig.displayRange.max, commitmentGapConfig.displayValue[0] || commitmentGapConfig.displayRange.min)),
                  Math.max(commitmentGapConfig.displayRange.min, Math.min(commitmentGapConfig.displayRange.max, commitmentGapConfig.displayValue[1] || commitmentGapConfig.displayRange.max))
                ]}
                onValueChange={(value) => updateFilter("commitment_gap", value)}
                min={commitmentGapConfig.displayRange.min}
                max={commitmentGapConfig.displayRange.max}
                step={commitmentGapConfig.useLakhs
                  ? Math.max(0.01, (commitmentGapConfig.displayRange.max - commitmentGapConfig.displayRange.min) / 1000)
                  : Math.max(0.1, Math.floor((commitmentGapConfig.displayRange.max - commitmentGapConfig.displayRange.min) / 100))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{commitmentGapConfig.useLakhs ? commitmentGapConfig.displayValue[0].toFixed(2) : commitmentGapConfig.displayValue[0]}{commitmentGapConfig.unit}</span>
                <span>₹{commitmentGapConfig.useLakhs ? commitmentGapConfig.displayValue[1].toFixed(2) : commitmentGapConfig.displayValue[1]}{commitmentGapConfig.unit}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Project Cost Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Project Cost (in {projectCostConfig.unitLabel})
            </Label>
            <div className="space-y-4">
              <Slider
                value={[
                  Math.max(projectCostConfig.displayRange.min, Math.min(projectCostConfig.displayRange.max, projectCostConfig.displayValue[0] || projectCostConfig.displayRange.min)),
                  Math.max(projectCostConfig.displayRange.min, Math.min(projectCostConfig.displayRange.max, projectCostConfig.displayValue[1] || projectCostConfig.displayRange.max))
                ]}
                onValueChange={(value) => updateFilter("project_cost", value)}
                min={projectCostConfig.displayRange.min}
                max={projectCostConfig.displayRange.max}
                step={projectCostConfig.useLakhs
                  ? Math.max(0.01, (projectCostConfig.displayRange.max - projectCostConfig.displayRange.min) / 1000)
                  : Math.max(0.1, Math.floor((projectCostConfig.displayRange.max - projectCostConfig.displayRange.min) / 100))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{projectCostConfig.useLakhs ? projectCostConfig.displayValue[0].toFixed(2) : projectCostConfig.displayValue[0]}{projectCostConfig.unit}</span>
                <span>₹{projectCostConfig.useLakhs ? projectCostConfig.displayValue[1].toFixed(2) : projectCostConfig.displayValue[1]}{projectCostConfig.unit}</span>
              </div>
            </div>
          </div>
        </div>
    </>
  )

  if (hideCardWrapper) {
    return (
      <div className={className}>
        <div className="space-y-6">
          {filterContent}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Project Filters
            </CardTitle>
            <CardDescription>
              Filter projects by various criteria
            </CardDescription>
          </div>
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {filterContent}
      </CardContent>
    </Card>
  )
}

