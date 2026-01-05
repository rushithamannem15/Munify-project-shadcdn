import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Upload,
  X,
  FileText,
  User,
  Building2,
  FileImage,
  FileVideo,
  File,
  Download,
  Video,
  Clock,
  Link as LinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { alerts } from '@/lib/alerts'

interface DocumentRequest {
  id: number
  project_reference_id: string
  requested_by: string
  description: string
  requested_at: string
  request_type: 'document' | 'meeting'
  status: string
  project?: {
    id: number
    title: string
  }
  uploaded_documents?: UploadedDocument[]
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

interface UploadedDocument {
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
  uploaded_by: string
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
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

export default function DocumentRequestUpload() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  

  // Form state for documents
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  
  // Form state for meetings
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [meetingRecording, setMeetingRecording] = useState<File | null>(null)
  const [meetingNotes, setMeetingNotes] = useState('')
  const [markComplete, setMarkComplete] = useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState<{
    files?: string
    meetingDate?: string
    meetingTime?: string
    meetingLink?: string
  }>({})

  // Dummy request data (no backend call) - matching MunicipalDocumentRequests
  const request: DocumentRequest | undefined = useMemo(() => {
    if (!id) return undefined
    
    const dummyRequests: DocumentRequest[] = [
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
        meeting_scheduled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        meeting_link: 'https://zoom.us/j/1234567890',
        project: {
          id: 102,
          title: 'Water Supply System Upgrade',
        }
      }
    ]
    
    return dummyRequests.find(r => r.id === Number(id))
  }, [id])

  const isLoadingRequest = false

  // Dummy uploaded documents data (no backend call)
  const uploadedDocuments: UploadedDocument[] = useMemo(() => {
    if (!id) return []
    
    // Return dummy uploaded documents for request ID 1
    if (Number(id) === 1) {
      return [
        {
          id: 1,
          file_id: 201,
          file: {
            id: 201,
            filename: 'dpr-document.pdf',
            original_filename: 'Detailed Project Report - PROJ-2024-001.pdf',
            mime_type: 'application/pdf',
            file_size: 2048576
          },
          uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          uploaded_by: 'municipality_user'
        },
        {
          id: 2,
          file_id: 202,
          file: {
            id: 202,
            filename: 'feasibility-study.pdf',
            original_filename: 'Feasibility Study Report.pdf',
            mime_type: 'application/pdf',
            file_size: 1536000
          },
          uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          uploaded_by: 'municipality_user'
        }
      ]
    }
    
    return []
  }, [id])

  const isLoadingDocs = false

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)

    // Create preview URLs for images
    const newPreviewUrls = selectedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
      }
      return ''
    })
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    
    // Revoke object URLs
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    
    setFiles(newFiles)
    setPreviewUrls(newPreviewUrls)
  }

  // Validation
  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (request?.request_type === 'document') {
      if (files.length === 0 && !markComplete) {
        newErrors.files = 'At least one document is required'
      }
    } else if (request?.request_type === 'meeting') {
      if (!markComplete) {
        if (!meetingDate) {
          newErrors.meetingDate = 'Meeting date is required'
        }
        if (!meetingTime) {
          newErrors.meetingTime = 'Meeting time is required'
        }
        if (!meetingLink) {
          newErrors.meetingLink = 'Meeting link (Zoom) is required'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Upload documents mutation (simulated - no backend call)
  const uploadDocumentsMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error('Please fix validation errors')
      }

      if (!id) {
        throw new Error('Request ID is required')
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Return mock success response
      return {
        success: true,
        message: request?.request_type === 'document' 
          ? 'Documents uploaded successfully'
          : 'Meeting scheduled successfully'
      }
    },
    onSuccess: () => {
      const successMessage = request?.request_type === 'document'
        ? 'Documents Uploaded'
        : markComplete
        ? 'Meeting marked as complete'
        : 'Meeting Scheduled'
      const successText = request?.request_type === 'document'
        ? 'Documents have been uploaded successfully.'
        : markComplete
        ? 'Meeting has been marked as complete.'
        : 'Meeting has been scheduled successfully.'
      
      alerts.success(successMessage, successText)
      resetForm()
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/main/municipal/document-requests')
      }, 1500)
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        `Failed to ${request?.request_type === 'document' ? 'upload documents' : 'schedule meeting'}. Please try again.`
      alerts.error('Error', message)
    },
  })

  // Schedule meeting mutation (simulated - no backend call)
  const scheduleMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error('Please fix validation errors')
      }

      if (!id) {
        throw new Error('Request ID is required')
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        message: markComplete ? 'Meeting marked as complete' : 'Meeting scheduled successfully'
      }
    },
    onSuccess: () => {
      alerts.success(
        markComplete ? 'Meeting Completed' : 'Meeting Scheduled',
        markComplete 
          ? 'Meeting has been marked as complete successfully.'
          : 'Meeting has been scheduled successfully. Notifications will be sent to all parties.'
      )
      resetForm()
      setTimeout(() => {
        navigate('/main/municipal/document-requests')
      }, 1500)
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to schedule meeting. Please try again.'
      alerts.error('Error', message)
    },
  })

  const resetForm = () => {
    setFiles([])
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    setPreviewUrls([])
    setNotes('')
    setMeetingDate('')
    setMeetingTime('')
    setMeetingLink('')
    setMeetingRecording(null)
    setMeetingNotes('')
    setMarkComplete(false)
    setErrors({})
  }

  const handleMeetingRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMeetingRecording(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      if (request?.request_type === 'document') {
        uploadDocumentsMutation.mutate()
      } else {
        scheduleMeetingMutation.mutate()
      }
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    return File
  }

  const handleDownloadFile = async (_fileId: number, filename: string) => {
    // Simulate file download (no backend call)
    alerts.info('Download', `File "${filename}" would be downloaded. (Simulated - no backend connection)`)
  }

  if (isLoadingRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size={24} />
          <span className="ml-2 text-muted-foreground">Loading request details...</span>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Document request not found. Please go back and try again.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/main/municipal/document-requests')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {request.request_type === 'document' ? 'Upload Documents' : 'Schedule Meeting'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Request ID: #{request.id} • {request.project_reference_id}
            {request.request_type === 'meeting' && (
              <Badge variant="outline" className="ml-2 border-purple-300 text-purple-600">
                <Video className="h-3 w-3 mr-1" />
                Meeting Request
              </Badge>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/main/municipal/document-requests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Project:</span>
                  <span>{request.project?.title || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Project Reference:</span>
                  <span>{request.project_reference_id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Requested by:</span>
                  <span>{request.requested_by}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Requested on:</span>
                  <span>{formatDate(request.requested_at)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={request.status === 'completed' ? 'outline' : 'default'}>
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
                {request.request_type === 'meeting' && request.meeting_scheduled_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Scheduled:</span>
                    <span>{formatDate(request.meeting_scheduled_at)}</span>
                    {request.meeting_link && (
                      <a 
                        href={request.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Join Meeting
                      </a>
                    )}
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Request Description:</p>
                <p className="text-sm text-muted-foreground">{request.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Form Card - Document Upload or Meeting Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {request.request_type === 'document' ? (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload Documents
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    Schedule Meeting
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {request.request_type === 'document'
                  ? 'Upload the requested documents for this request.'
                  : 'Schedule a meeting and provide meeting details. You can also upload meeting recording after the meeting concludes.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {request.request_type === 'document' ? (
                  <>
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="files">
                        Documents <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="files"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="cursor-pointer"
                          disabled={markComplete}
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {errors.files && (
                        <p className="text-sm text-destructive">{errors.files}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Select one or more documents to upload
                      </p>

                      {/* File Previews */}
                      {files.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          {files.map((file, index) => {
                            const isImage = file.type.startsWith('image/')
                            const previewUrl = previewUrls[index]
                            const FileIcon = getFileIcon(file.type)

                            return (
                              <div key={index} className="relative border rounded-lg p-2">
                                {isImage && previewUrl ? (
                                  <img
                                    src={previewUrl}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
                                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                <p className="text-xs mt-2 truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-6 w-6"
                                  onClick={() => removeFile(index)}
                                  disabled={markComplete}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any additional notes about the uploaded documents..."
                        rows={4}
                        className="resize-none"
                        disabled={markComplete}
                      />
                    </div>

                    {/* Mark Complete Checkbox */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="markComplete"
                        checked={markComplete}
                        onChange={(e) => setMarkComplete(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="markComplete" className="text-sm font-normal cursor-pointer">
                        Mark request as complete (documents already uploaded)
                      </Label>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Meeting Date */}
                    <div className="space-y-2">
                      <Label htmlFor="meetingDate">
                        Meeting Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="meetingDate"
                        type="date"
                        value={meetingDate}
                        onChange={(e) => {
                          setMeetingDate(e.target.value)
                          if (errors.meetingDate) {
                            setErrors({ ...errors, meetingDate: undefined })
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className={errors.meetingDate ? 'border-destructive' : ''}
                        disabled={markComplete}
                      />
                      {errors.meetingDate && (
                        <p className="text-sm text-destructive">{errors.meetingDate}</p>
                      )}
                    </div>

                    {/* Meeting Time */}
                    <div className="space-y-2">
                      <Label htmlFor="meetingTime">
                        Meeting Time <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="meetingTime"
                        type="time"
                        value={meetingTime}
                        onChange={(e) => {
                          setMeetingTime(e.target.value)
                          if (errors.meetingTime) {
                            setErrors({ ...errors, meetingTime: undefined })
                          }
                        }}
                        className={errors.meetingTime ? 'border-destructive' : ''}
                        disabled={markComplete}
                      />
                      {errors.meetingTime && (
                        <p className="text-sm text-destructive">{errors.meetingTime}</p>
                      )}
                    </div>

                    {/* Meeting Link (Zoom) */}
                    <div className="space-y-2">
                      <Label htmlFor="meetingLink">
                        Meeting Link (Zoom) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="meetingLink"
                        type="url"
                        value={meetingLink}
                        onChange={(e) => {
                          setMeetingLink(e.target.value)
                          if (errors.meetingLink) {
                            setErrors({ ...errors, meetingLink: undefined })
                          }
                        }}
                        placeholder="https://zoom.us/j/1234567890"
                        className={errors.meetingLink ? 'border-destructive' : ''}
                        disabled={markComplete}
                      />
                      {errors.meetingLink && (
                        <p className="text-sm text-destructive">{errors.meetingLink}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Provide the Zoom meeting link or offline meeting details
                      </p>
                    </div>

                    {/* Meeting Recording Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="meetingRecording">
                        Meeting Recording (Optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="meetingRecording"
                          type="file"
                          accept="video/*"
                          onChange={handleMeetingRecordingChange}
                          className="cursor-pointer"
                          disabled={markComplete}
                        />
                        <Video className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {meetingRecording && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileVideo className="h-4 w-4" />
                          <span className="text-sm">{meetingRecording.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(meetingRecording.size)})
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() => setMeetingRecording(null)}
                            disabled={markComplete}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload meeting recording after the meeting concludes (visible to Lender/Admin)
                      </p>
                    </div>

                    {/* Meeting Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="meetingNotes">Meeting Notes (Optional)</Label>
                      <Textarea
                        id="meetingNotes"
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        placeholder="Add any additional notes about the meeting..."
                        rows={4}
                        className="resize-none"
                        disabled={markComplete}
                      />
                    </div>

                    {/* Mark Complete Checkbox */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="markComplete"
                        checked={markComplete}
                        onChange={(e) => setMarkComplete(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="markComplete" className="text-sm font-normal cursor-pointer">
                        Mark meeting as complete (meeting concluded)
                      </Label>
                    </div>
                  </>
                )}

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/main/municipal/document-requests')}
                    disabled={uploadDocumentsMutation.isPending || scheduleMeetingMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploadDocumentsMutation.isPending || scheduleMeetingMutation.isPending}
                  >
                    {(uploadDocumentsMutation.isPending || scheduleMeetingMutation.isPending) ? (
                      <>
                        <Spinner className="mr-2" size={16} />
                        {request.request_type === 'document' ? 'Uploading...' : 'Scheduling...'}
                      </>
                    ) : (
                      <>
                        {request.request_type === 'document' ? (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {markComplete ? 'Mark Complete' : 'Upload Documents'}
                          </>
                        ) : (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            {markComplete ? 'Mark Complete' : 'Schedule Meeting'}
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Previously Uploaded Documents / Meeting Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {request.request_type === 'document' ? 'Uploaded Documents' : 'Meeting Information'}
              </CardTitle>
              <CardDescription>
                {request.request_type === 'document'
                  ? 'Documents previously uploaded for this request'
                  : 'Meeting details and recordings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {request.request_type === 'document' ? (
                <>
                  {isLoadingDocs ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size={20} />
                    </div>
                  ) : uploadedDocuments.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No documents have been uploaded yet for this request.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uploadedDocuments.map((doc) => {
                        const FileIcon = getFileIcon(doc.file.mime_type)
                        return (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                                <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {doc.file.original_filename || doc.file.filename}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.file.file_size)} • {formatDate(doc.uploaded_at)}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => handleDownloadFile(doc.file.id, doc.file.original_filename || doc.file.filename)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {request.meeting_scheduled_at ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium text-sm">Scheduled Meeting</span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <div className="mb-1">
                            <span className="font-medium">Date:</span> {formatDate(request.meeting_scheduled_at)}
                          </div>
                          {request.meeting_link && (
                            <div className="mt-2">
                              <a 
                                href={request.meeting_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:underline flex items-center gap-1"
                              >
                                <LinkIcon className="h-3 w-3" />
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      {request.meeting_recording && (
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-sm">Meeting Recording</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {formatDate(request.meeting_recording.uploaded_at)}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadFile(request.meeting_recording!.file.id, request.meeting_recording!.file.original_filename)}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Recording
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Meeting has not been scheduled yet.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

