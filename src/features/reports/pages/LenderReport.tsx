import { useState, useMemo } from 'react'
import { FileSpreadsheet, Download, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DataTable, type ColumnDef } from '@/components/data-table/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'

interface LenderReportData {
  project: string
  municipality: string
  commitmentDate: Date
  commitmentAmount: number
  commitmentRate: number
  acceptanceDate: Date | null
  acceptanceAmount: number
  acceptanceRate: number
  acceptanceRatio: number
}

// Dummy data
const generateDummyData = (): LenderReportData[] => {
  const projects = [
    'Smart City Infrastructure',
    'Water Supply Project',
    'Road Development',
    'Waste Management System',
    'Solar Power Plant',
    'Healthcare Facility',
    'Education Infrastructure',
    'Public Transport System',
  ]

  const municipalities = [
    'Mumbai Municipal Corporation',
    'Delhi Municipal Corporation',
    'Bangalore Municipal Corporation',
    'Chennai Municipal Corporation',
    'Kolkata Municipal Corporation',
    'Hyderabad Municipal Corporation',
    'Pune Municipal Corporation',
    'Ahmedabad Municipal Corporation',
  ]

  const data: LenderReportData[] = []
  
  for (let i = 0; i < 25; i++) {
    const commitmentDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const commitmentAmount = Math.floor(Math.random() * 500000000) + 10000000 // 1Cr to 50Cr
    const commitmentRate = parseFloat((Math.random() * 5 + 5).toFixed(2)) // 5% to 10%
    
    const isAccepted = Math.random() > 0.2 // 80% acceptance rate
    const acceptanceRatio = isAccepted ? parseFloat((Math.random() * 40 + 60).toFixed(2)) : 0 // 60% to 100%
    const acceptanceAmount = isAccepted ? Math.floor(commitmentAmount * (acceptanceRatio / 100)) : 0
    const acceptanceRate = isAccepted ? parseFloat((commitmentRate + (Math.random() * 2 - 1)).toFixed(2)) : 0
    const acceptanceDate = isAccepted 
      ? new Date(commitmentDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) 
      : null

    data.push({
      project: projects[Math.floor(Math.random() * projects.length)],
      municipality: municipalities[Math.floor(Math.random() * municipalities.length)],
      commitmentDate,
      commitmentAmount,
      commitmentRate,
      acceptanceDate,
      acceptanceAmount,
      acceptanceRate,
      acceptanceRatio,
    })
  }

  return data.sort((a, b) => b.commitmentDate.getTime() - a.commitmentDate.getTime())
}

// Format currency in Indian Rupees
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

// Format percentage
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`
}

// Format date
const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function LenderReport() {
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [projectOpen, setProjectOpen] = useState(false)
  const [municipalityOpen, setMunicipalityOpen] = useState(false)
  const [sectorOpen, setSectorOpen] = useState(false)

  // Dummy filter options
  const projects = [
    'Smart City Infrastructure',
    'Water Supply Project',
    'Road Development',
    'Waste Management System',
    'Solar Power Plant',
    'Healthcare Facility',
    'Education Infrastructure',
    'Public Transport System',
  ]

  const municipalities = [
    'Mumbai Municipal Corporation',
    'Delhi Municipal Corporation',
    'Bangalore Municipal Corporation',
    'Chennai Municipal Corporation',
    'Kolkata Municipal Corporation',
    'Hyderabad Municipal Corporation',
    'Pune Municipal Corporation',
    'Ahmedabad Municipal Corporation',
  ]

  const sectors = [
    'Infrastructure',
    'Water & Sanitation',
    'Transport',
    'Energy',
    'Healthcare',
    'Education',
    'Waste Management',
    'Urban Development',
  ]

  // Generate dummy data
  const allData = useMemo(() => generateDummyData(), [])

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let filtered = [...allData]

    // Filter by date range
    if (fromDate) {
      filtered = filtered.filter(
        (item) => item.commitmentDate >= fromDate
      )
    }
    if (toDate) {
      filtered = filtered.filter(
        (item) => item.commitmentDate <= toDate
      )
    }

    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter((item) => item.project === selectedProject)
    }

    // Filter by municipality
    if (selectedMunicipality !== 'all') {
      filtered = filtered.filter((item) => item.municipality === selectedMunicipality)
    }

    // Filter by sector (dummy - would need sector data in real implementation)
    // For now, we'll skip this filter as we don't have sector in the data structure

    return filtered
  }, [allData, fromDate, toDate, selectedProject, selectedMunicipality, selectedSector])

  // Calculate totals
  const totals = useMemo(() => {
    const totalCommitment = filteredData.reduce((sum, item) => sum + item.commitmentAmount, 0)
    const totalAcceptance = filteredData.reduce((sum, item) => sum + item.acceptanceAmount, 0)
    const overallAcceptanceRatio = totalCommitment > 0 
      ? (totalAcceptance / totalCommitment) * 100 
      : 0

    return {
      totalCommitment,
      totalAcceptance,
      overallAcceptanceRatio,
    }
  }, [filteredData])

  // Clear filters
  const handleClearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setSelectedProject('all')
    setSelectedMunicipality('all')
    setSelectedSector('all')
  }

  // Check if any filters are active
  const hasActiveFilters = fromDate || toDate || selectedProject !== 'all' || selectedMunicipality !== 'all' || selectedSector !== 'all'

  // Define columns
  const columns: ColumnDef<LenderReportData, any>[] = [
    {
      accessorKey: 'project',
      header: 'Project',
      cell: ({ row }) => <span className="font-medium">{row.original.project}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'municipality',
      header: 'Municipality',
      cell: ({ row }) => <span>{row.original.municipality}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentDate',
      header: 'Commitment Date',
      cell: ({ row }) => <span>{formatDate(row.original.commitmentDate)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentAmount',
      header: 'Commitment Amount',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.commitmentAmount)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentRate',
      header: 'Commitment Rate',
      cell: ({ row }) => <span>{formatPercentage(row.original.commitmentRate)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'acceptanceDate',
      header: 'Acceptance Date',
      cell: ({ row }) => <span>{formatDate(row.original.acceptanceDate)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'acceptanceAmount',
      header: 'Acceptance Amount',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.acceptanceAmount)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'acceptanceRate',
      header: 'Acceptance Rate',
      cell: ({ row }) => <span>{formatPercentage(row.original.acceptanceRate)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'acceptanceRatio',
      header: 'Acceptance Ratio',
      cell: ({ row }) => <span>{formatPercentage(row.original.acceptanceRatio)}</span>,
      enableSorting: true,
    },
  ]

  // Use filtered data directly (without totals row in data)
  const tableData = filteredData

  // Quick date presets
  const applyDatePreset = (preset: 'last7' | 'last30' | 'last90') => {
    const now = new Date()
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let from = new Date(to)
    if (preset === 'last7') from.setDate(to.getDate() - 7)
    if (preset === 'last30') from.setDate(to.getDate() - 30)
    if (preset === 'last90') from.setDate(to.getDate() - 90)
    setFromDate(from)
    setToDate(to)
  }

  // Export to CSV function
  const handleExportToCSV = () => {
    const headers = ['Project', 'Municipality', 'Commitment Date', 'Commitment Amount', 'Commitment Rate', 'Acceptance Date', 'Acceptance Amount', 'Acceptance Rate', 'Acceptance Ratio']
    const rows = filteredData.map((item) => [
      item.project,
      item.municipality,
      formatDate(item.commitmentDate),
      item.commitmentAmount.toString(),
      item.commitmentRate.toString(),
      formatDate(item.acceptanceDate),
      item.acceptanceAmount.toString(),
      item.acceptanceRate.toString(),
      item.acceptanceRatio.toString(),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lender-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    // For now just clear filters and re-apply
    handleClearFilters()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lender Report</h1>
          <p className="text-muted-foreground mt-2">
            View and analyze lender commitments and acceptances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/70 via-slate-50 to-white shadow-sm">
        <CardContent className="pt-6">
          {/* Labels Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
            <Label htmlFor="fromDate" className="text-sm font-medium">From Date</Label>
            <Label htmlFor="toDate" className="text-sm font-medium">To Date</Label>
            <Label htmlFor="project" className="text-sm font-medium">Project</Label>
            <Label htmlFor="municipality" className="text-sm font-medium">Municipality</Label>
            <Label htmlFor="sector" className="text-sm font-medium">Sector</Label>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <DatePicker
              value={fromDate}
              onChange={setFromDate}
              placeholder="Select from date"
              buttonClassName="w-full"
            />
            <DatePicker
              value={toDate}
              onChange={setToDate}
              placeholder="Select to date"
              buttonClassName="w-full"
            />
            <Popover open={projectOpen} onOpenChange={setProjectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={projectOpen}
                  className="w-full justify-between"
                >
                  {selectedProject === 'all'
                    ? 'All Projects'
                    : projects.find((p) => p === selectedProject) || 'All Projects'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search projects..." />
                  <CommandList>
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedProject('all')
                          setProjectOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedProject === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        All Projects
                      </CommandItem>
                      {projects.map((project) => (
                        <CommandItem
                          key={project}
                          value={project}
                          onSelect={() => {
                            setSelectedProject(project)
                            setProjectOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedProject === project ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {project}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover open={municipalityOpen} onOpenChange={setMunicipalityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={municipalityOpen}
                  className="w-full justify-between"
                >
                  {selectedMunicipality === 'all'
                    ? 'All Municipalities'
                    : municipalities.find((m) => m === selectedMunicipality) || 'All Municipalities'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search municipalities..." />
                  <CommandList>
                    <CommandEmpty>No municipality found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedMunicipality('all')
                          setMunicipalityOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedMunicipality === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        All Municipalities
                      </CommandItem>
                      {municipalities.map((municipality) => (
                        <CommandItem
                          key={municipality}
                          value={municipality}
                          onSelect={() => {
                            setSelectedMunicipality(municipality)
                            setMunicipalityOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedMunicipality === municipality ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {municipality}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover open={sectorOpen} onOpenChange={setSectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={sectorOpen}
                  className="w-full justify-between"
                >
                  {selectedSector === 'all'
                    ? 'All Sectors'
                    : sectors.find((s) => s === selectedSector) || 'All Sectors'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search sectors..." />
                  <CommandList>
                    <CommandEmpty>No sector found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedSector('all')
                          setSectorOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedSector === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        All Sectors
                      </CommandItem>
                      {sectors.map((sector) => (
                        <CommandItem
                          key={sector}
                          value={sector}
                          onSelect={() => {
                            setSelectedSector(sector)
                            setSectorOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedSector === sector ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {sector}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Ranges and Action Buttons Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Quick ranges:</span>
              <Button variant="outline" size="sm" onClick={() => applyDatePreset('last7')}>
                Last 7 days
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyDatePreset('last30')}>
                Last 30 days
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyDatePreset('last90')}>
                Last 90 days
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="default">
                Apply Filters
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilters}
              >
                Reset Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {filteredData.length > 0 && (
        <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/70 via-slate-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Commitment</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.totalCommitment)}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Acceptance</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.totalAcceptance)}</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Overall Acceptance Ratio</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatPercentage(totals.overallAcceptanceRatio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No records found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No records found for selected filters. Please adjust your filters and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-0">
          <DataTable<LenderReportData, any>
            title="Lender Report"
            description={`Showing ${filteredData.length} record(s)`}
            columns={columns}
            data={tableData}
            showToolbar={true}
            showFooter={true}
            enableExport={false}
            actions={
              <Button variant="default" size="sm" onClick={handleExportToCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}

