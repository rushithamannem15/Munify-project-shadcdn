import { Link } from "react-router-dom"
import { ArrowLeft, Home, Printer, RefreshCw, Download, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface QuickLink {
  label: string
  path: string
}

interface MonitoringScreenHeaderProps {
  screenName: string
  description?: string
  showBackButton?: boolean
  backButtonPath?: string
  quickLinks?: QuickLink[]
  onExport?: () => void
  onPrint?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  exportLabel?: string
}

export function MonitoringScreenHeader({
  screenName,
  description,
  showBackButton = false,
  backButtonPath = "/main/admin/monitoring",
  quickLinks = [],
  onExport,
  onPrint,
  onRefresh,
  isRefreshing = false,
  exportLabel = "Export to Excel",
}: MonitoringScreenHeaderProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/main">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/main/admin/monitoring">Admin Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{screenName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Back Button, Title, and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = backButtonPath)}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{screenName}</h1>
          {description && <p className="text-muted-foreground mt-1.5">{description}</p>}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Quick Links
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Navigate To</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link to={link.path}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Refresh */}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}

          {/* Export */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              {exportLabel}
            </Button>
          )}

          {/* Print */}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  )
}

