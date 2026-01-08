import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import apiService from "@/services/api"
import { alerts } from "@/lib/alerts"
import { useAuth } from "@/contexts/auth-context"
import { 
  MapPin, 
  Calendar, 
  Star,
  Eye,
  AlertCircle,
  Upload,
  FileText,
  X,
  History,
  Clock,
  CheckCircle,
  Edit,
  Plus
} from "lucide-react"

// Helper function to normalize API response
const normalizeProjects = (data: any): any[] => {
  return data?.data || []
}

// Helper function to normalize numeric amount (in rupees)
const normalizeAmount = (amount: string | number): number => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
  return Number.isNaN(numAmount) ? 0 : numAmount
}

// Helper function to format amounts for display with dynamic units
// e.g. 950 → ₹950, 150000 → ₹1.5L, 25000000 → ₹2.5Cr
const formatAmountDisplay = (amount: number): string => {
  if (!amount || Number.isNaN(amount)) return "₹0"

  if (amount >= 10000000) {
    // 1 Cr = 10,000,000
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  }

  if (amount >= 100000) {
    // 1 Lakh = 100,000
    return `₹${(amount / 100000).toFixed(1)}L`
  }

  if (amount >= 1000) {
    // Thousands for mid‑range small amounts
    return `₹${(amount / 1000).toFixed(1)}K`
  }

  // Very small amounts – show full rupee value
  return `₹${amount.toFixed(0)}`
}

// Helper function to format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
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

// Helper function to format date and time
const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Interface for commitment history item
interface CommitmentHistoryItem {
  id: number
  commitment_id: number
  project_id: string
  organization_type: string
  organization_id: string
  committed_by: string
  amount: string
  funding_mode: string
  interest_rate: string
  tenure_months: number
  terms_conditions_text: string | null
  status: string
  action: string
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

// Commitment History Dialog Component
interface CommitmentHistoryDialogProps {
  open: boolean
  commitmentId: number | null
  projectTitle: string
  onClose: () => void
}

function CommitmentHistoryDialog({
  open,
  commitmentId,
  projectTitle,
  onClose,
}: CommitmentHistoryDialogProps) {
  // Fetch commitment history
  const { data, isLoading, error, isError } = useQuery<any>({
    queryKey: ['commitment-history', commitmentId],
    queryFn: async () => {
      if (!commitmentId) {
        throw new Error("Commitment ID is required")
      }
      try {
        const response = await apiService.get<any>(`/commitments/${commitmentId}/history`)
        return response
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to fetch commitment history'
        alerts.error('Error', errorMessage)
        throw err
      }
    },
    enabled: open && !!commitmentId, // Only fetch when dialog is open and commitmentId exists
  })

  // Normalize API response to array
  const historyItems = useMemo(() => {
    return (data?.data || []) as CommitmentHistoryItem[]
  }, [data])

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return <Plus className="h-4 w-4" />
      case 'updated':
        return <Edit className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'updated':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'approved') {
      return 'bg-green-600'
    } else if (statusLower === 'under_review') {
      return 'bg-yellow-600'
    } else if (statusLower === 'rejected') {
      return 'bg-red-600'
    }
    return 'bg-gray-600'
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Commitment History
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            View the complete history for <span className="font-medium">{projectTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner size={20} />
                <span>Loading commitment history...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(error as any)?.response?.data?.message ||
                  (error as any)?.response?.data?.detail ||
                  (error as Error)?.message ||
                  'Failed to fetch commitment history. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* History Timeline */}
          {!isLoading && !isError && (
            <>
              {historyItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No history found</h3>
                      <p className="text-sm text-muted-foreground">
                        No commitment history available for this project.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <Card key={item.id} className="relative">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          {/* Timeline indicator */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getActionColor(item.action)}`}>
                            {getActionIcon(item.action)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 space-y-3 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className={getActionColor(item.action)}>
                                    {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                                  </Badge>
                                  <Badge className={getStatusBadgeColor(item.status)}>
                                    {item.status.split('_').map((word: string) =>
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDateTime(item.created_at)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="ml-2 font-medium">{formatAmountDisplay(normalizeAmount(item.amount))}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Funding Mode:</span>
                                <span className="ml-2 font-medium capitalize">{item.funding_mode}</span>
                              </div>
                              {item.interest_rate && (
                                <div>
                                  <span className="text-muted-foreground">Interest Rate:</span>
                                  <span className="ml-2 font-medium text-blue-600">{parseFloat(item.interest_rate).toFixed(2)}%</span>
                                </div>
                              )}
                              {item.tenure_months && (
                                <div>
                                  <span className="text-muted-foreground">Tenure:</span>
                                  <span className="ml-2 font-medium">{item.tenure_months} {item.tenure_months === 1 ? 'Month' : 'Months'}</span>
                                </div>
                              )}
                            </div>

                            {/* Terms & Conditions */}
                            {item.terms_conditions_text && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Terms & Conditions:</p>
                                <p className="text-xs text-muted-foreground">{item.terms_conditions_text}</p>
                              </div>
                            )}

                            {/* Created By */}
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                {item.action === 'created' ? 'Created' : 'Updated'} by: <span className="font-medium">{item.created_by}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Disbursement Document Dialog Component
interface DisbursementDialogProps {
  open: boolean
  commitmentId: number | null
  projectTitle: string
  onClose: () => void
}

function DisbursementDocumentDialog({
  open,
  commitmentId,
  projectTitle,
  onClose,
}: DisbursementDialogProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")

  const handleClose = () => {
    setSelectedFile(null)
    setFileError("")
    // Reset file input
    const input = document.getElementById('disbursementFile') as HTMLInputElement
    if (input) {
      input.value = ''
    }
    onClose()
  }

  // Upload disbursement document mutation
  const uploadDisbursementMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!commitmentId) {
        throw new Error("Commitment ID is required")
      }
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', 'disbursement')
      
      // organization_id is optional, can be fetched from commitment
      if (user?.data?.userBranches?.[1]?.branchId) {
        formData.append('organization_id', String(user.data.userBranches[1].branchId))
      }
      
      return apiService.post(`/commitments/${commitmentId}/files/upload`, formData)
    },
    onSuccess: () => {
      alerts.success('Success', 'Disbursement document uploaded successfully')
      queryClient.invalidateQueries({ queryKey: ['projects', 'funded-by-user'] })
      handleClose()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload disbursement document. Please try again.'
      alerts.error('Error', errorMessage)
      setFileError(errorMessage)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
      setFileError("")
    }
  }

  const handleSubmit = () => {
    if (!selectedFile) {
      setFileError("Please select a file to upload")
      return
    }
    
    if (!commitmentId) {
      alerts.error('Error', 'Commitment ID is required')
      return
    }

    uploadDisbursementMutation.mutate(selectedFile)
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFileError("")
    // Reset file input
    const input = document.getElementById('disbursementFile') as HTMLInputElement
    if (input) {
      input.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Submit Disbursement Document</DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Upload the disbursement document for <span className="font-medium">{projectTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="disbursementFile" className="text-sm font-medium">
              Disbursement Document *
            </Label>
            <div className="space-y-2">
              <Input
                id="disbursementFile"
                type="file"
                onChange={handleFileChange}
                className="h-9 text-sm cursor-pointer"
                disabled={uploadDisbursementMutation.isPending}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {selectedFile && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={removeFile}
                    disabled={uploadDisbursementMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {fileError && (
                <p className="text-xs text-destructive mt-1">{fileError}</p>
              )}
              {!fileError && (
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadDisbursementMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || uploadDisbursementMutation.isPending}
          >
            {uploadDisbursementMutation.isPending ? (
              <>
                <Spinner size={16} className="mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MyProjects() {
  const navigate = useNavigate()
  const userId = "shubhamw20" // TODO: Replace with auth user id
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<{
    commitmentId: number
    projectTitle: string
  } | null>(null)

  // Fetch funded projects by user
  const { data, isLoading, error, isError } = useQuery<any>({
    queryKey: ['projects', 'funded-by-user', userId],
    queryFn: async () => {
      try {
        const response = await apiService.get<any>('/projects/funded-by-user', {
          committed_by: userId,
          skip: 0,
          limit: 100
        })
        return response
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to fetch funded projects'
        alerts.error('Error', errorMessage)
        throw err
      }
    },
  })

  // Normalize API response to array
  const fundedProjects = useMemo(() => {
    return normalizeProjects(data)
  }, [data])

  const handleOpenDisbursementDialog = (project: any, commitment: any) => {
    const commitmentId = commitment.id || commitment.commitment_id
    if (commitmentId) {
      setSelectedProject({
        commitmentId,
        projectTitle: project.title || 'Untitled Project'
      })
      setDisbursementDialogOpen(true)
    } else {
      alerts.error('Error', 'Commitment ID not found')
    }
  }

  const handleOpenHistoryDialog = (project: any, commitment: any) => {
    const commitmentId = commitment.id || commitment.commitment_id
    if (commitmentId) {
      setSelectedProject({
        commitmentId,
        projectTitle: project.title || 'Untitled Project'
      })
      setHistoryDialogOpen(true)
    } else {
      alerts.error('Error', 'Commitment ID not found')
    }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p>View of funded projects by you</p>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as any)?.response?.data?.message ||
              (error as any)?.response?.data?.detail ||
              (error as Error)?.message ||
              'Failed to fetch funded projects. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner size={20} />
            <span>Loading funded projects...</span>
          </div>
        </div>
      )}

      {/* Funded Projects */}
      {!isLoading && !isError && (
        <>
          {fundedProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="text-center">
                  <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No funded projects</h3>
                  <p className="text-sm text-muted-foreground">
                    You haven't funded any projects yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {fundedProjects.map((project: any) => {
                // Get commitment details from API response
                const commitment = project.commitment || project.commitment_details || {}
                const commitmentStatus = commitment.status || 0
                const commitmentAmount = commitment.amount || 0
                const commitmentId = commitment.id || commitment.commitment_id
                
                const myInvestment = normalizeAmount(commitmentAmount)
                const expectedROI = commitment.interest_rate || project.average_interest_rate || null
                const currentValue = expectedROI ? myInvestment * (1 + (expectedROI / 100)) : myInvestment
                const municipality = project.city || project.state || project.organization_id || 'N/A'
                const stateDisplay = project.state || 'N/A'
                const statusDisplay = commitmentStatus
                  ? commitmentStatus.split('_').map((word: string) =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                  : 'Live'
                const projectImage = project.image || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop&crop=center'
                const investmentDate = commitment.created_at || commitment.commitment_date || project.created_at || project.fundraising_start_date || new Date().toISOString()
                
                // Extract commitment-specific fields
                const projectReferenceId = project.project_reference_id || commitment.project_reference_id || 'N/A'
                const fundingMode = commitment.funding_mode || project.funding_mode || 'N/A'
                const tenureMonths = commitment.tenure_months || project.tenure_months || null
                const termsConditions = commitment.terms_conditions_text || commitment.terms || project.terms_conditions_text || null
                
                // Check if commitment is approved (case-insensitive)
                const isApproved = commitmentStatus && 
                  typeof commitmentStatus === 'string' && 
                  commitmentStatus.toLowerCase() === 'approved'

                return (
                  <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 relative">
                      <img
                        src={projectImage}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop&crop=center'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-600">
                          {statusDisplay}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{municipality}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4" />
                            <span className="text-sm">My Investment</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{project.title || 'Untitled Project'}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{stateDisplay}</span>
                          </CardDescription>
                          <div className="pt-1">
                            <span className="text-xs text-muted-foreground">Ref ID: </span>
                            <span className="text-xs font-mono font-medium">{projectReferenceId}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{project.category || 'N/A'}</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Investment Details */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>My Investment</span>
                          <span className="font-medium">{formatAmountDisplay(myInvestment)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Current Value</span>
                          <span className="font-medium text-green-600">{formatAmountDisplay(currentValue)}</span>
                        </div>
                        {expectedROI !== null && (
                          <div className="flex justify-between text-sm">
                            <span>Interest Rate</span>
                            <span className="font-medium text-blue-600">{Math.round(expectedROI * 10) / 10}%</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Funding Mode</span>
                          <span className="font-medium capitalize">{fundingMode}</span>
                        </div>
                        {tenureMonths && (
                          <div className="flex justify-between text-sm">
                            <span>Tenure</span>
                            <span className="font-medium">{tenureMonths} {tenureMonths === 1 ? 'Month' : 'Months'}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Project Progress */}
                      {/* <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Project Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div> */}
                      
                      {/* Investment Date */}
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Invested: {formatDate(investmentDate)}</span>
                      </div>
                      
                      {/* Terms & Conditions */}
                      {termsConditions && (
                        <div className="pt-2 border-t">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Terms & Conditions</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {termsConditions}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-4">
                        <Button 
                          className="flex-1"
                          onClick={() => navigate(`/main/projects/${project.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {/* Commitment History Button */}
                        {commitmentId && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleOpenHistoryDialog(project, commitment)}
                            title="View Commitment History"
                            className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-600"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Disbursement Document Button - Show only when approved */}
                        {isApproved && commitmentId && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleOpenDisbursementDialog(project, commitment)}
                            title="Submit Disbursement Document"
                            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Commitment History Dialog */}
      {selectedProject && (
        <CommitmentHistoryDialog
          open={historyDialogOpen}
          commitmentId={selectedProject.commitmentId}
          projectTitle={selectedProject.projectTitle}
          onClose={() => {
            setHistoryDialogOpen(false)
            setSelectedProject(null)
          }}
        />
      )}

      {/* Disbursement Document Dialog */}
      {selectedProject && (
        <DisbursementDocumentDialog
          open={disbursementDialogOpen}
          commitmentId={selectedProject.commitmentId}
          projectTitle={selectedProject.projectTitle}
          onClose={() => {
            setDisbursementDialogOpen(false)
            setSelectedProject(null)
          }}
        />
      )}
    </div>
  )
}
