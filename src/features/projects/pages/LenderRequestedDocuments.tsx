import { useMemo } from 'react'
import { Download, FileText, Calendar, Building2, Video, Clock, Link as LinkIcon } from 'lucide-react'
import { DataTable, type ColumnDef } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { alerts } from '@/lib/alerts'

interface DocumentRequest {
  id: number
  project_reference_id: string
  project_title: string
  query_description: string
  requested_at: string
  request_type: 'document' | 'meeting'
  status: 'pending' | 'active' | 'completed'
  responded_at?: string | null
  documents?: {
    id: number
    file_id: number
    filename: string
    original_filename: string
    file_size: number
    uploaded_at: string
  }[]
  meeting_scheduled_at?: string | null
  meeting_link?: string | null
  meeting_recording?: {
    id: number
    file_id: number
    file: {
      id: number
      filename: string
      original_filename: string
      mime_type: string
      file_size: number
    }
    uploaded_at: string
  } | null
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function LenderRequestedDocuments() {
  // Dummy data for document and meeting requests (no backend call)
  const documentRequests: DocumentRequest[] = useMemo(() => {
    return [
      {
        id: 1,
        project_reference_id: 'PROJ-2024-001',
        project_title: 'Smart City Infrastructure Development',
        query_description: 'We need the detailed project report (DPR) and feasibility study documents to evaluate the project for funding. Please provide the latest versions of these documents.',
        requested_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'completed',
        responded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        documents: [
          {
            id: 1,
            file_id: 201,
            filename: 'dpr-document.pdf',
            original_filename: 'Detailed Project Report - PROJ-2024-001.pdf',
            file_size: 2048576,
            uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            file_id: 202,
            filename: 'feasibility-study.pdf',
            original_filename: 'Feasibility Study Report.pdf',
            file_size: 1536000,
            uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: 2,
        project_reference_id: 'PROJ-2024-002',
        project_title: 'Water Supply System Upgrade',
        query_description: 'Requesting budget approval documents and compliance certificates for project PROJ-2024-002. These documents are required for our internal review process.',
        requested_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'completed',
        responded_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        documents: [
          {
            id: 3,
            file_id: 203,
            filename: 'budget-approval.pdf',
            original_filename: 'Budget Approval Document.pdf',
            file_size: 1024000,
            uploaded_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: 3,
        project_reference_id: 'PROJ-2024-003',
        project_title: 'Road Infrastructure Improvement',
        query_description: 'Please provide the tender/RFP documents and any additional technical specifications for the project. We are interested in understanding the procurement process.',
        requested_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'completed',
        responded_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        documents: [
          {
            id: 4,
            file_id: 204,
            filename: 'tender-documents.pdf',
            original_filename: 'Tender and RFP Documents.pdf',
            file_size: 3072000,
            uploaded_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: 4,
        project_reference_id: 'PROJ-2024-001',
        project_title: 'Smart City Infrastructure Development',
        query_description: 'Need updated financial statements and project cost breakdown documents for our due diligence process.',
        requested_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'active',
        documents: []
      },
      {
        id: 5,
        project_reference_id: 'PROJ-2024-004',
        project_title: 'Waste Management System',
        query_description: 'Requesting environmental clearance certificates and land acquisition documents for project evaluation.',
        requested_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'document',
        status: 'completed',
        responded_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        documents: [
          {
            id: 5,
            file_id: 205,
            filename: 'environmental-clearance.pdf',
            original_filename: 'Environmental Clearance Certificate.pdf',
            file_size: 512000,
            uploaded_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 6,
            file_id: 206,
            filename: 'land-acquisition.pdf',
            original_filename: 'Land Acquisition Documents.pdf',
            file_size: 1536000,
            uploaded_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: 6,
        project_reference_id: 'PROJ-2024-001',
        project_title: 'Smart City Infrastructure Development',
        query_description: 'We would like to schedule a meeting to discuss clarifications beyond Q&A regarding the project implementation timeline and resource allocation.',
        requested_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'meeting',
        status: 'completed',
        responded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_scheduled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_link: 'https://zoom.us/j/1234567890',
        meeting_recording: {
          id: 1,
          file_id: 301,
          file: {
            id: 301,
            filename: 'meeting-recording.mp4',
            original_filename: 'Meeting Recording - PROJ-2024-001.mp4',
            mime_type: 'video/mp4',
            file_size: 52428800
          },
          uploaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: 7,
        project_reference_id: 'PROJ-2024-002',
        project_title: 'Water Supply System Upgrade',
        query_description: 'Requesting a meeting invitation to clarify technical aspects and discuss potential collaboration opportunities.',
        requested_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'meeting',
        status: 'completed',
        responded_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_scheduled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_link: 'https://zoom.us/j/9876543210'
      },
      {
        id: 8,
        project_reference_id: 'PROJ-2024-003',
        project_title: 'Road Infrastructure Improvement',
        query_description: 'We need additional clarification meeting to discuss project milestones and deliverables in detail.',
        requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        request_type: 'meeting',
        status: 'active'
      }
    ]
  }, [])

  const handleDownloadDocument = (_fileId: number, filename: string) => {
    // Simulate download (no backend call)
    alerts.info('Download', `File "${filename}" would be downloaded. (Simulated - no backend connection)`)
  }

  const columns: ColumnDef<DocumentRequest, any>[] = [
    {
      accessorKey: 'project_reference_id',
      header: 'Project Reference ID',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Building2 className="h-4 w-4 text-indigo-500" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {row.original.project_reference_id}
            </span>
          </div>
        )
      },
      size: 200,
      minSize: 180,
    },
    {
      accessorKey: 'project_title',
      header: 'Project Title',
      cell: ({ row }) => {
        return (
          <span className="text-gray-700 dark:text-gray-300">
            {row.original.project_title}
          </span>
        )
      },
    },
    {
      accessorKey: 'query_description',
      header: 'Query',
      cell: ({ row }) => {
        return (
          <div className="max-w-md">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {row.original.query_description}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'request_type',
      header: 'Type',
      cell: ({ row }) => {
        const requestType = row.original.request_type
        return (
          <Badge 
            variant="outline"
            className={
              requestType === 'document'
                ? 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400'
                : 'border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400'
            }
          >
            {requestType === 'document' ? (
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
        )
      },
    },
    {
      accessorKey: 'documents',
      header: 'Response',
      cell: ({ row }) => {
        const request = row.original
        if (request.request_type === 'document') {
          const documents = request.documents || []
          if (documents.length === 0) {
            return (
              <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                No documents
              </Badge>
            )
          }
          return (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {documents.length} file{documents.length !== 1 ? 's' : ''}
              </span>
            </div>
          )
        } else {
          // Meeting request
          if (request.meeting_scheduled_at) {
            return (
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scheduled
                </span>
              </div>
            )
          }
          return (
            <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              Not scheduled
            </Badge>
          )
        }
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusConfig = {
          pending: {
            label: 'Pending',
            className: 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
          },
          active: {
            label: 'Active',
            className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
          },
          completed: {
            label: 'Completed',
            className: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
          }
        }
        const config = statusConfig[status] || statusConfig.pending
        return (
          <Badge className={config.className}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'requested_at',
      header: 'Requested Date',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5 text-orange-500" />
            {formatDate(row.original.requested_at)}
          </div>
        )
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      header: 'Actions',
      cell: ({ row }) => {
        const request = row.original

        if (request.request_type === 'document') {
          const documents = request.documents || []
          const hasDocuments = documents.length > 0

          if (!hasDocuments) {
            return (
              <span className="text-sm text-muted-foreground">No documents available</span>
            )
          }

          if (documents.length === 1) {
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadDocument(documents[0].file_id, documents[0].original_filename)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {documents.map((doc) => (
                  <DropdownMenuItem
                    key={doc.id}
                    onClick={() => handleDownloadDocument(doc.file_id, doc.original_filename)}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">{doc.original_filename}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        } else {
          // Meeting request actions
          if (!request.meeting_scheduled_at) {
            return (
              <span className="text-sm text-muted-foreground">Meeting not scheduled</span>
            )
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                >
                  <Video className="h-4 w-4 mr-2" />
                  View Meeting
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {request.meeting_link && (
                  <DropdownMenuItem
                    onClick={() => window.open(request.meeting_link!, '_blank')}
                    className="cursor-pointer"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Join Meeting</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(request.meeting_scheduled_at)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}
                {request.meeting_recording && (
                  <DropdownMenuItem
                    onClick={() => handleDownloadDocument(request.meeting_recording!.file.id, request.meeting_recording!.file.original_filename)}
                    className="cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Download Recording</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(request.meeting_recording.file.file_size)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}
                {!request.meeting_recording && (
                  <DropdownMenuItem disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-muted-foreground">Recording not available</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Documents & Meetings</h1>
        <p className="text-muted-foreground mt-1">
          View and download documents or access meeting details uploaded/scheduled by municipalities in response to your requests
        </p>
      </div>

      {/* Data Table */}
      <DataTable<DocumentRequest, any>
        title="Requests"
        description="All document and meeting requests you have made and their responses from municipalities"
        columns={columns}
        data={documentRequests}
        enableExport={true}
        exportFilename="documents-and-meetings.csv"
      />
    </div>
  )
}

