import { useState, useMemo, useRef } from 'react'
import { FileSpreadsheet, ChevronDown, ChevronRight, Download, Check } from 'lucide-react'
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
import type { Table as TanTable } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface LenderCommitment {
  lender: string
  amount: number
  rate: number
  condition: string
}

interface CurrentStatusData {
  municipality: string
  project: string
  commitmentOpenDate: Date
  commitmentCloseDate: Date
  fundingRequirement: number
  commitmentTillDate: number
  lenderCommitments: LenderCommitment[]
  sector: string
}

// Dummy data
const generateDummyData = (): CurrentStatusData[] => {
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

  const lenders = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
  ]

  const conditions = [
    'Subject to project completion within 24 months',
    'Requires quarterly progress reports',
    'Collateral required: 20% of project value',
    'Interest rate subject to market conditions',
    'Requires municipal guarantee',
    'Subject to environmental clearance',
  ]

  const data: CurrentStatusData[] = []
  
  projects.forEach((project, index) => {
    const fundingRequirement = Math.floor(Math.random() * 1000000000) + 50000000 // 5Cr to 100Cr
    const commitmentOpenDate = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1)
    const commitmentCloseDate = new Date(commitmentOpenDate.getTime() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000) // 30-90 days later
    
    // Generate 2-5 lender commitments per project
    const numLenders = Math.floor(Math.random() * 4) + 2
    const lenderCommitments: LenderCommitment[] = []
    let totalCommitment = 0
    
    for (let i = 0; i < numLenders; i++) {
      const amount = Math.floor(Math.random() * (fundingRequirement / numLenders) * 0.8) + (fundingRequirement / numLenders * 0.2)
      const rate = parseFloat((Math.random() * 4 + 6).toFixed(2)) // 6% to 10%
      totalCommitment += amount
      
      lenderCommitments.push({
        lender: lenders[Math.floor(Math.random() * lenders.length)],
        amount,
        rate,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
      })
    }

    data.push({
      municipality: municipalities[index % municipalities.length],
      project,
      commitmentOpenDate,
      commitmentCloseDate,
      fundingRequirement,
      commitmentTillDate: totalCommitment,
      lenderCommitments,
      sector: sectors[index % sectors.length],
    })
  })

  return data.sort((a, b) => b.commitmentOpenDate.getTime() - a.commitmentOpenDate.getTime())
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

export default function CurrentStatusReport() {
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [municipalityOpen, setMunicipalityOpen] = useState(false)
  const [sectorOpen, setSectorOpen] = useState(false)
  const tableRef = useRef<TanTable<CurrentStatusData> | null>(null)

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

    // Filter by date range (using commitment open date)
    if (fromDate) {
      filtered = filtered.filter(
        (item) => item.commitmentOpenDate >= fromDate
      )
    }
    if (toDate) {
      filtered = filtered.filter(
        (item) => item.commitmentOpenDate <= toDate
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

  // Calculate totals
  const totals = useMemo(() => {
    const totalFundingRequirement = filteredData.reduce((sum, item) => sum + item.fundingRequirement, 0)
    const totalCommitmentTillDate = filteredData.reduce((sum, item) => sum + item.commitmentTillDate, 0)
    
    return {
      totalFundingRequirement,
      totalCommitmentTillDate,
    }
  }, [filteredData])

  // Toggle row expansion (handled by DataTable's onRowExpand)
  const handleRowExpand = (rowId: string, isExpanded: boolean) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (isExpanded) {
        newSet.add(rowId)
      } else {
        newSet.delete(rowId)
      }
      return newSet
    })
  }

  // Get unique row ID
  // Note: TanStack Table passes a Row object, so we need to handle both Row and original data
  const getRowId = (row: any, _index: number): string => {
    // Handle both Row object (from TanStack Table) and original data
    const data = row.original || row
    return `${data.municipality}-${data.project}`
  }

  // Render expanded content (lender commitments)
  const renderExpandedContent = (row: CurrentStatusData, _rowId: string): React.ReactNode => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold mb-3">Lender Commitments Detail</h3>
        <div className="space-y-2">
          {row.lenderCommitments.map((commitment, idx) => (
            <div
              key={idx}
              className="grid grid-cols-4 gap-4 p-3 bg-background rounded-md border"
            >
              <div>
                <p className="text-xs text-muted-foreground">Lender</p>
                <p className="font-medium text-sm">{commitment.lender}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium text-sm">{formatCurrency(commitment.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="font-medium text-sm">{formatPercentage(commitment.rate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Condition</p>
                <p className="text-sm">{commitment.condition}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Clear filters
  const handleClearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setSelectedMunicipality('all')
    setSelectedSector('all')
    if (tableRef.current) {
      tableRef.current.setGlobalFilter('')
    }
  }

  // Check if any filters are active
  const hasActiveFilters = fromDate || toDate || selectedMunicipality !== 'all' || selectedSector !== 'all'

  // Define columns
  const columns: ColumnDef<CurrentStatusData, any>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => {
        // Use row.id which is set by TanStack Table when getRowId is provided
        const rowId = row.id
        const isExpanded = expandedRows.has(rowId)
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              handleRowExpand(rowId, !isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
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
      accessorKey: 'commitmentOpenDate',
      header: 'Commitment Open Date',
      cell: ({ row }) => <span>{formatDate(row.original.commitmentOpenDate)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentCloseDate',
      header: 'Commitment Close Date',
      cell: ({ row }) => <span>{formatDate(row.original.commitmentCloseDate)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'fundingRequirement',
      header: 'Funding Requirement',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.fundingRequirement)}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentTillDate',
      header: 'Commitment till Date',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.commitmentTillDate)}</span>,
      enableSorting: true,
    },
  ]

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
    const headers = ['Municipality', 'Project', 'Commitment Open Date', 'Commitment Close Date', 'Funding Requirement', 'Commitment till Date']
    const rows = filteredData.map((item) => [
      item.municipality,
      item.project,
      formatDate(item.commitmentOpenDate),
      formatDate(item.commitmentCloseDate),
      item.fundingRequirement.toString(),
      item.commitmentTillDate.toString(),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'current-status-report.csv'
    a.click()
    URL.revokeObjectURL(url)
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
          <h1 className="text-3xl font-bold">Current Status Report</h1>
          <p className="text-muted-foreground mt-2">
            View current status of projects with commitment details (Admin view)
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

      {/* Report Summary */}
      {filteredData.length > 0 && (
        <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/70 via-slate-50 to-white shadow-sm">
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Projects</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{filteredData.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Funding Requirement</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.totalFundingRequirement)}</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Total Commitment till Date</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.totalCommitmentTillDate)}</p>
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
        <DataTable<CurrentStatusData, any>
          title="Current Status Report"
          description={`Showing ${filteredData.length} project(s)`}
          columns={columns}
          data={filteredData}
          showToolbar={true}
          showFooter={true}
          enableExport={false}
          enableRowExpansion={true}
          getRowId={getRowId}
          renderExpandedContent={renderExpandedContent}
          expandedRows={expandedRows}
          onRowExpand={handleRowExpand}
          actions={
            <Button variant="default" size="sm" onClick={handleExportToCSV}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          }
          onTableReady={(table) => {
            tableRef.current = table
          }}
        />
      )}
    </div>
  )
}

