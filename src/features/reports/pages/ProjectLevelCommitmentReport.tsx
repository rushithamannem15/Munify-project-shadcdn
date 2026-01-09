import { useState, useMemo } from 'react'
import { FileSpreadsheet, Group, Download, Check, ChevronDown } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface ProjectCommitmentData {
  project: string
  lender: string
  commitmentDate: Date
  commitmentAmount: number
  commitmentRate: number
  conditions: string
  sector: string
}

// Dummy data
const generateDummyData = (): ProjectCommitmentData[] => {
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

  const lenders = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'IDBI Bank',
    'Kotak Mahindra Bank',
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

  const conditions = [
    'Subject to project completion within 24 months',
    'Requires quarterly progress reports',
    'Collateral required: 20% of project value',
    'Interest rate subject to market conditions',
    'Requires municipal guarantee',
    'Subject to environmental clearance',
    'Requires land acquisition completion',
    'Subject to government approvals',
  ]

  const data: ProjectCommitmentData[] = []
  
  // Generate data with multiple lenders per project
  projects.forEach((project, projectIndex) => {
    const projectSector = sectors[projectIndex % sectors.length]
    const numLenders = Math.floor(Math.random() * 4) + 2 // 2-5 lenders per project
    
    for (let i = 0; i < numLenders; i++) {
      const commitmentDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      const commitmentAmount = Math.floor(Math.random() * 300000000) + 5000000 // 50L to 30Cr
      const commitmentRate = parseFloat((Math.random() * 4 + 6).toFixed(2)) // 6% to 10%

      data.push({
        project,
        lender: lenders[Math.floor(Math.random() * lenders.length)],
        commitmentDate,
        commitmentAmount,
        commitmentRate,
        conditions: conditions[Math.floor(Math.random() * conditions.length)],
        sector: projectSector,
      })
    }
  })

  return data.sort((a, b) => {
    // Sort by project first, then by commitment date
    if (a.project !== b.project) {
      return a.project.localeCompare(b.project)
    }
    return b.commitmentDate.getTime() - a.commitmentDate.getTime()
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

export default function ProjectLevelCommitmentReport() {
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [groupByProject, setGroupByProject] = useState<boolean>(false)
  const [projectOpen, setProjectOpen] = useState(false)
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

    // Filter by sector
    if (selectedSector !== 'all') {
      filtered = filtered.filter((item) => item.sector === selectedSector)
    }

    return filtered
  }, [allData, fromDate, toDate, selectedProject, selectedSector])

  // Calculate total commitment per project
  const projectTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    filteredData.forEach((item) => {
      totals[item.project] = (totals[item.project] || 0) + item.commitmentAmount
    })
    return totals
  }, [filteredData])

  // Calculate overall totals
  const totals = useMemo(() => {
    const totalCommitment = filteredData.reduce((sum, item) => sum + item.commitmentAmount, 0)
    return {
      totalCommitment,
    }
  }, [filteredData])

  // Group data by project if enabled
  const groupedData = useMemo(() => {
    if (!groupByProject) return filteredData

    const grouped: Record<string, ProjectCommitmentData[]> = {}
    filteredData.forEach((item) => {
      if (!grouped[item.project]) {
        grouped[item.project] = []
      }
      grouped[item.project].push(item)
    })

    // Flatten grouped data with project totals
    const result: (ProjectCommitmentData & { isProjectHeader?: boolean; projectTotal?: number })[] = []
    Object.keys(grouped).sort().forEach((project) => {
      const items = grouped[project]
      result.push({
        project,
        lender: '',
        commitmentDate: new Date(),
        commitmentAmount: projectTotals[project] || 0,
        commitmentRate: 0,
        conditions: '',
        sector: items[0]?.sector || '',
        isProjectHeader: true,
        projectTotal: projectTotals[project] || 0,
      } as ProjectCommitmentData & { isProjectHeader: boolean; projectTotal: number })
      result.push(...items)
    })

    return result
  }, [filteredData, groupByProject, projectTotals])

  // Clear filters
  const handleClearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setSelectedProject('all')
    setSelectedSector('all')
  }

  // Check if any filters are active
  const hasActiveFilters = fromDate || toDate || selectedProject !== 'all' || selectedSector !== 'all'

  // Define columns
  const columns: ColumnDef<ProjectCommitmentData & { isProjectHeader?: boolean; projectTotal?: number }, any>[] = [
    {
      accessorKey: 'project',
      header: 'Project',
      cell: ({ row }) => {
        const isHeader = (row.original as any).isProjectHeader
        return (
          <span className={isHeader ? 'font-bold text-primary' : 'font-medium'}>
            {isHeader ? `${row.original.project} (Total)` : row.original.project}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'lender',
      header: 'Lender',
      cell: ({ row }) => {
        const isHeader = (row.original as any).isProjectHeader
        return <span>{isHeader ? '-' : row.original.lender}</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentDate',
      header: 'Commitment Date',
      cell: ({ row }) => {
        const isHeader = (row.original as any).isProjectHeader
        return <span>{isHeader ? '-' : formatDate(row.original.commitmentDate)}</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentAmount',
      header: 'Commitment Amount',
      cell: ({ row }) => {
        const isHeader = (row.original as any).isProjectHeader
        return (
          <span className={isHeader ? 'font-bold' : 'font-medium'}>
            {formatCurrency(row.original.commitmentAmount)}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'commitmentRate',
      header: 'Commitment Rate',
      cell: ({ row }) => {
        const isHeader = (row.original as any).isProjectHeader
        return <span>{isHeader ? '-' : formatPercentage(row.original.commitmentRate)}</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'conditions',
      header: 'Conditions',
      cell: ({ row }) => {
        const isHeader = (row.original as any).isProjectHeader
        return (
          <span className={isHeader ? '' : 'max-w-md truncate'} title={isHeader ? '' : row.original.conditions}>
            {isHeader ? '-' : row.original.conditions}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: 'totalCommitmentForProject',
      header: 'Total Commitment for Project',
      cell: ({ row }) => {
        const isHeader = (row.original as any).isProjectHeader
        const projectTotal = projectTotals[row.original.project] || 0
        return (
          <span className={isHeader ? 'font-bold' : 'font-medium'}>
            {formatCurrency(projectTotal)}
          </span>
        )
      },
      enableSorting: false,
    },
  ]

  // Use filtered or grouped data
  const tableData = groupByProject ? groupedData : filteredData

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
    const headers = ['Project', 'Lender', 'Commitment Date', 'Commitment Amount', 'Commitment Rate', 'Conditions', 'Total Commitment for Project']
    const rows = filteredData.map((item) => {
      const key = `${item.project}`
      const projectTotal = projectTotals[key] || 0
      return [
        item.project,
        item.lender,
        formatDate(item.commitmentDate),
        item.commitmentAmount.toString(),
        item.commitmentRate.toString(),
        item.conditions,
        projectTotal.toString(),
      ]
    })

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project-level-commitment-report.csv'
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
          <h1 className="text-3xl font-bold">Project-level Commitment Report</h1>
          <p className="text-muted-foreground mt-2">
            View and analyze project-level commitments from lenders (Municipality view)
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
            <Label htmlFor="project" className="text-sm font-medium">Project</Label>
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

          {/* Quick Ranges, Group By, and Action Buttons Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="groupByProject"
                  checked={groupByProject}
                  onCheckedChange={(checked) => setGroupByProject(checked === true)}
                />
                <Label
                  htmlFor="groupByProject"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <Group className="h-4 w-4" />
                  Group by Project
                </Label>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Records</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{filteredData.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Commitment</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.totalCommitment)}</p>
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
          <DataTable<ProjectCommitmentData & { isProjectHeader?: boolean; projectTotal?: number }, any>
            title="Project-level Commitment Report"
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

