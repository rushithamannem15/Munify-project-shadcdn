import { useState, useMemo } from 'react'
import { FileSpreadsheet, Filter, Download, Check, ChevronDown } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'

interface ProjectSuccessAdminData {
  municipality: string
  project: string
  projectAmount: number
  commitment: number
  acceptance: number
  commitmentPercentage: number
  acceptancePercentage: number
  sector: string
  projectDate: Date
}

// Dummy data
const generateDummyData = (): ProjectSuccessAdminData[] => {
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

  const data: ProjectSuccessAdminData[] = []
  
  // Generate data with projects distributed across municipalities
  projects.forEach((project, index) => {
    const municipality = municipalities[index % municipalities.length]
    const projectAmount = Math.floor(Math.random() * 1000000000) + 50000000 // 5Cr to 100Cr
    const commitmentPercentage = parseFloat((Math.random() * 40 + 60).toFixed(2)) // 60% to 100%
    const commitment = Math.floor(projectAmount * (commitmentPercentage / 100))
    
    const acceptancePercentage = parseFloat((Math.random() * 30 + 50).toFixed(2)) // 50% to 80% of commitment
    const acceptance = Math.floor(commitment * (acceptancePercentage / 100))
    
    const projectDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)

    data.push({
      municipality,
      project,
      projectAmount,
      commitment,
      acceptance,
      commitmentPercentage,
      acceptancePercentage,
      sector: sectors[index % sectors.length],
      projectDate,
    })
  })

  return data.sort((a, b) => {
    // Sort by municipality first, then by project date
    if (a.municipality !== b.municipality) {
      return a.municipality.localeCompare(b.municipality)
    }
    return b.projectDate.getTime() - a.projectDate.getTime()
  })
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

export default function ProjectSuccessReportAdmin() {
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [municipalityOpen, setMunicipalityOpen] = useState(false)
  const [sectorOpen, setSectorOpen] = useState(false)

  // Dummy filter options
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
        (item) => item.projectDate >= fromDate
      )
    }
    if (toDate) {
      filtered = filtered.filter(
        (item) => item.projectDate <= toDate
      )
    }

    // Filter by municipality
    if (selectedMunicipality !== 'all') {
      filtered = filtered.filter((item) => item.municipality === selectedMunicipality)
    }

    // Filter by sector
    if (selectedSector !== 'all') {
      filtered = filtered.filter((item) => item.sector === selectedSector)
    }

    return filtered
  }, [allData, fromDate, toDate, selectedMunicipality, selectedSector])

  // Calculate overall totals and percentages (aggregated across all municipalities)
  const totals = useMemo(() => {
    const totalProjectAmount = filteredData.reduce((sum, item) => sum + item.projectAmount, 0)
    const totalCommitment = filteredData.reduce((sum, item) => sum + item.commitment, 0)
    const totalAcceptance = filteredData.reduce((sum, item) => sum + item.acceptance, 0)
    
    const overallCommitmentPercentage = totalProjectAmount > 0 
      ? (totalCommitment / totalProjectAmount) * 100 
      : 0
    
    const overallAcceptancePercentage = totalProjectAmount > 0
      ? (totalAcceptance / totalProjectAmount) * 100
      : 0

    return {
      totalProjectAmount,
      totalCommitment,
      totalAcceptance,
      overallCommitmentPercentage,
      overallAcceptancePercentage,
    }
  }, [filteredData])

  // Clear filters
  const handleClearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setSelectedMunicipality('all')
    setSelectedSector('all')
  }

  // Check if any filters are active
  const hasActiveFilters = fromDate || toDate || selectedMunicipality !== 'all' || selectedSector !== 'all'

  // Define columns
  const columns: ColumnDef<ProjectSuccessAdminData, any>[] = [
    {
      accessorKey: 'municipality',
      header: 'Municipality',
      cell: ({ row }) => <span className="font-medium">{row.original.municipality}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'project',
      header: 'Project',
      cell: ({ row }) => <span className="font-medium">{row.original.project}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'projectAmount',
      header: 'Project Amount',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.projectAmount)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitment',
      header: 'Commitment',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.commitment)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'acceptance',
      header: 'Acceptance',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.acceptance)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentPercentage',
      header: 'Commitment (%)',
      cell: ({ row }) => <span>{formatPercentage(row.original.commitmentPercentage)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'acceptancePercentage',
      header: 'Acceptance (%)',
      cell: ({ row }) => <span>{formatPercentage(row.original.acceptancePercentage)}</span>,
      enableSorting: true,
    },
  ]

  // Export to CSV function
  const handleExportToCSV = () => {
    const headers = ['Municipality', 'Project', 'Project Amount', 'Commitment', 'Acceptance', 'Commitment (%)', 'Acceptance (%)']
    const rows = filteredData.map((item) => [
      item.municipality,
      item.project,
      item.projectAmount.toString(),
      item.commitment.toString(),
      item.acceptance.toString(),
      item.commitmentPercentage.toString(),
      item.acceptancePercentage.toString(),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project-success-report-admin.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

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

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    handleClearFilters()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Project Success Report</h1>
          <p className="text-muted-foreground mt-2">
            View and analyze project success metrics aggregated across all municipalities (Admin view)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
            <Label htmlFor="fromDate" className="text-sm font-medium">From Date</Label>
            <Label htmlFor="toDate" className="text-sm font-medium">To Date</Label>
            <Label htmlFor="municipality" className="text-sm font-medium">Municipality</Label>
            <Label htmlFor="sector" className="text-sm font-medium">Sector</Label>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Report Summary - Aggregated View */}
      {filteredData.length > 0 && (
        <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/70 via-slate-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle>Aggregated Summary (Across All Municipalities)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Projects</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{filteredData.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Project Amount</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.totalProjectAmount)}</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Total Commitment</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.totalCommitment)}</p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Overall Commitment %</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatPercentage(totals.overallCommitmentPercentage)}</p>
              </div>
              <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Overall Acceptance %</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatPercentage(totals.overallAcceptancePercentage)}</p>
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
          <DataTable<ProjectSuccessAdminData, any>
            title="Project Success Report"
            description={`Showing ${filteredData.length} project(s) aggregated across all municipalities`}
            columns={columns}
            data={filteredData}
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

