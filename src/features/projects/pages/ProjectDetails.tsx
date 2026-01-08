import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiService, { api } from "@/services/api"
import { Spinner } from "@/components/ui/spinner"

import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { alerts } from "@/lib/alerts"
import { 
  MapPin, 
  Calendar, 
  Clock,
  Heart,
  MessageCircle,
  FileText,
  Image,
  AlertCircle,
  IndianRupee,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Info,
  Download,
  Play,
  Video,
  Mic,
  CheckCircle,
  FilePlus,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { FundingCommitmentDialog } from "@/features/projects/components/FundingCommitmentDialog"
import { RequestDocumentDialog } from "@/features/projects/components/RequestDocumentDialog"
import { RequestMeetingDialog } from "@/features/projects/components/RequestMeetingDialog"

interface AnswerDocument {
  id: number
  question_reply_id: number
  file_id: number
  uploaded_by: string
  file: {
    id: number
    organization_id: string
    uploaded_by: string
    filename: string
    original_filename: string
    mime_type: string
    file_size: number
    storage_path: string
    checksum: string
    access_level: string
    download_count: number
    is_deleted: boolean
    deleted_at: string | null
    created_at: string
    created_by: string
    updated_at: string
    updated_by: string
  }
  created_at: string
  updated_at: string
}

interface QuestionAnswer {
  id: number
  project_id: string
  asked_by: string
  question_text: string
  status: string
  category?: string | null
  priority?: string | null
  created_at?: string
  updated_at?: string
  // The backend may embed answer information either in a nested object or flat fields.
  answer?: {
    id?: number
    reply_text?: string
    replied_by_user_id?: string | number
    document_links?: string | null
    documents?: AnswerDocument[]
    created_at?: string
  } | null
  // Fallback flat fields (defensive)
  reply_text?: string
  replied_by_user_id?: string | number
  document_links?: string | null
}

interface QuestionsListApiResponse {
  status: string
  message: string
  data: QuestionAnswer[]
  total?: number
}

interface ProjectDocument {
  id: number
  project_id: string
  file_id: number
  document_type: string
  version: number
  access_level: string
  uploaded_by: string
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
  file: {
    id: number
    organization_id: string
    uploaded_by: string
    filename: string
    original_filename: string
    mime_type: string
    file_size: number
    storage_path: string
    checksum: string
    access_level: string
    download_count: number
    is_deleted: boolean
    deleted_at: string | null
    created_at: string
    created_by: string
    updated_at: string
    updated_by: string
  }
}

interface ProjectApiResponse {
  status: string
  message: string
  data: {
    id: number
    organization_type: string
    organization_id: string
    project_reference_id: string
    title: string
    department: string
    contact_person: string
    contact_person_designation: string | null
    contact_person_email: string | null
    contact_person_phone: string | null
    category: string
    project_stage: string
    description: string
    start_date: string
    end_date: string
    state: string | null
    city: string | null
    ward: string | null
    total_project_cost: string
    funding_requirement: string
    already_secured_funds: string
    commitment_gap: string | null
    currency: string
    fundraising_start_date: string
    fundraising_end_date: string
    municipality_credit_rating: string
    municipality_credit_score: string
    status: string
    visibility: string
    funding_raised: string
    funding_percentage: number | null
    approved_at: string | null
    approved_by: string | null
    admin_notes: string | null
    created_at: string
    created_by: string
    updated_at: string
    updated_by: string | null
    // Additional fields from CreateProject
    funding_type?: string | null
    commitment_allocation_days?: number | null
    minimum_commitment_fulfilment_percentage?: number | null
    mode_of_implementation?: string | null
    ownership?: string | null
    tenure?: number | null
    cut_off_rate_percentage?: number | null
    minimum_commitment_amount?: string | null
    conditions?: string | null
    documents?: ProjectDocument[]
  }
}

interface ProjectNote {
  id: number
  project_reference_id: string
  organization_id: string
  title: string
  content: string
  tags: string[]
  created_by: string
  created_at: string
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")
  const queryClient = useQueryClient()

  const { user } = useAuth()
  const userData = user?.data
  const currentUserId = userData?.login

  // Treat municipality users (by org_type / userType / roleCode) as allowed to answer questions
  const isMunicipalityUser =
    typeof userData?.org_type === "string" && userData.org_type.toLowerCase() === "municipality"
      ? true
      : typeof userData?.userType === "string" && userData.userType.toLowerCase() === "municipality"
        ? true
        : typeof userData?.roleCode === "string" && userData.roleCode.toLowerCase().includes("municip")
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false)
  const [requestDocumentDialogOpen, setRequestDocumentDialogOpen] = useState(false)
  const [requestMeetingDialogOpen, setRequestMeetingDialogOpen] = useState(false)

  // Fetch project data with documents
  const { data, isLoading, error, isError } = useQuery<ProjectApiResponse>({
    queryKey: ['project', id],
    queryFn: async () => {
      return await apiService.get<ProjectApiResponse>(`/projects/${id}`, {
        include_documents: true
      })
    },
    enabled: !!id,
  })

  const project = data?.data
  const projectReferenceId = project?.project_reference_id

  // ---- Q&A: Fetch questions for this project ----
  // NOTE: This hook MUST be called before any early returns to follow Rules of Hooks
  const {
    data: questionsResponse,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
    error: questionsError,
  } = useQuery<QuestionsListApiResponse>({
    queryKey: ['questions', { project_id: projectReferenceId }],
    queryFn: async () => {
      return await apiService.get<QuestionsListApiResponse>('/questions', {
        project_id: projectReferenceId,
        skip: 0,
        limit: 20,
      })
    },
    enabled: !!projectReferenceId,
  })

  const questions: QuestionAnswer[] = questionsResponse?.data ?? []

  // ---- Q&A: Dialog and form state ----
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionAnswer | null>(null)

  const [questionText, setQuestionText] = useState("")
  const [questionCategory, setQuestionCategory] = useState<string>("")
  const [questionPriority, setQuestionPriority] = useState<string>("normal")

  // Municipality-only answer dialog state
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false)
  const [answeringQuestion, setAnsweringQuestion] = useState<QuestionAnswer | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [answerDocumentLinks, setAnswerDocumentLinks] = useState("")

  const resetQuestionForm = () => {
    setQuestionText("")
    setQuestionCategory("")
    setQuestionPriority("normal")
    setEditingQuestion(null)
  }

  const resetAnswerForm = () => {
    setAnswerText("")
    setAnswerDocumentLinks("")
    setAnsweringQuestion(null)
  }

  const getDisplayAnswer = (qa: QuestionAnswer | null) => {
    if (!qa) return null
    if (qa.answer && qa.answer.reply_text) {
      return qa.answer
    }
    if (qa.reply_text) {
      return {
        id: qa.answer?.id,
        reply_text: qa.reply_text,
        replied_by_user_id: qa.replied_by_user_id,
        document_links: qa.document_links,
        documents: qa.answer?.documents,
        created_at: qa.answer?.created_at,
      }
    }
    return null
  }

  // ---- Q&A: Mutations ----
  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!projectReferenceId) {
        throw new Error("Missing project reference id")
      }
      if (!questionText.trim()) {
        throw new Error("Question text is required")
      }

      const payload = {
        project_id: projectReferenceId,
        asked_by: currentUserId,
        question_text: questionText.trim(),
        category: questionCategory || undefined,
        priority: questionPriority || "normal",
        attachments: [] as any[],
      }

      return await apiService.post('/questions', payload)
    },
    onSuccess: () => {
      alerts.success("Question Submitted", "Your question has been created successfully.")
      resetQuestionForm()
      setIsAskDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['questions', { project_id: projectReferenceId }] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create question. Please try again."
      // Close the main dialog first, then show error alert
      resetQuestionForm()
      setIsAskDialogOpen(false)
      // Use setTimeout to ensure dialog closes before showing error alert
      setTimeout(() => {
        alerts.error("Error", message)
      }, 100)
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!projectReferenceId || !editingQuestion) {
        throw new Error("No question selected for update")
      }
      if (!questionText.trim()) {
        throw new Error("Question text is required")
      }

      const payload: Record<string, any> = {
        question_text: questionText.trim(),
        priority: questionPriority || undefined,
        category: questionCategory || undefined,
      }

      const endpoint = `/questions/${editingQuestion.id}?project_id=${encodeURIComponent(
        projectReferenceId,
      )}`

      return await apiService.put(endpoint, payload)
    },
    onSuccess: () => {
      alerts.success("Question Updated", "Your question has been updated.")
      resetQuestionForm()
      setIsAskDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['questions', { project_id: projectReferenceId }] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update question. This may happen if it already has an answer."
      // Close the main dialog first, then show error alert
      resetQuestionForm()
      setIsAskDialogOpen(false)
      // Use setTimeout to ensure dialog closes before showing error alert
      setTimeout(() => {
        alerts.error("Error", message)
      }, 100)
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: async (question: QuestionAnswer) => {
      if (!projectReferenceId) {
        throw new Error("Missing project reference id")
      }

      const endpoint = `/questions/${question.id}?project_id=${encodeURIComponent(
        projectReferenceId,
      )}&requested_by=${encodeURIComponent(currentUserId)}`

      return await apiService.delete(endpoint)
    },
    onSuccess: () => {
      alerts.success("Question Deleted", "Your question has been deleted.")
      queryClient.invalidateQueries({ queryKey: ['questions', { project_id: projectReferenceId }] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete question. Only the author can delete, and only if no answer exists."
      alerts.error("Error", message)
    },
  })

  // Municipality answer mutation (answer / edit answer for a question)
  const upsertAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!isMunicipalityUser) {
        throw new Error("Only municipality users can answer questions")
      }

      if (!projectReferenceId || !answeringQuestion) {
        throw new Error("No question selected for answer")
      }
      if (!answerText.trim()) {
        throw new Error("Answer text is required")
      }

      const existingAnswer = getDisplayAnswer(answeringQuestion)
      const payload = {
        reply_text: answerText.trim(),
        attachments: [] as any[],
        document_links: answerDocumentLinks.trim() || undefined,
      }

      const baseEndpoint = `/questions/${answeringQuestion.id}/answer?project_id=${encodeURIComponent(
        projectReferenceId,
      )}&replied_by_user_id=${encodeURIComponent(currentUserId)}`

      if (existingAnswer) {
        return await apiService.put(baseEndpoint, payload)
      }

      return await apiService.post(baseEndpoint, payload)
    },
    onSuccess: () => {
      alerts.success("Answer Saved", "The answer has been saved successfully.")
      resetAnswerForm()
      setIsAnswerDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['questions', { project_id: projectReferenceId }] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save answer. Please try again."
      // Close the main dialog first, then show error alert
      resetAnswerForm()
      setIsAnswerDialogOpen(false)
      // Use setTimeout to ensure dialog closes before showing error alert
      setTimeout(() => {
        alerts.error("Error", message)
      }, 100)
    },
  })

  // Handle URL hash to switch to Q&A tab
  useEffect(() => {
    const hash = window.location.hash
    if (hash === '#qa') {
      setActiveTab('qa')
    }
  }, [])

  // Format currency
  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return "₹0"
    const num = parseFloat(amount)
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)}Cr`
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)}L`
    } else if (num >= 1000) {
      return `₹${(num / 1000).toFixed(2)}K`
    }
    return `₹${num.toFixed(2)}`
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Handle file download
  const handleDownloadFile = async (fileId: number, filename: string) => {
    try {
      // Use axios directly to get blob response
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      })
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      alerts.success('Success', 'File downloaded successfully')
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to download file. Please try again.'
      alerts.error('Error', errorMessage)
      console.error('Error downloading file:', err)
    }
  }

  // Get document type display name
  const getDocumentTypeName = (documentType: string): string => {
    const typeMap: Record<string, string> = {
      'dpr': 'DPR (Detailed Project Report)',
      'feasibility_study': 'Feasibility Study',
      'compliance_certificate': 'Compliance Certificate',
      'budget_approval': 'Budget Approval',
      'tender_rfp': 'Tender / RFP',
      'project_image': 'Project Image',
      'optional_media': 'Media',
    }
    return typeMap[documentType] || documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Filter documents by type
  const documents = useMemo(() => {
    if (!project?.documents) return []
    return project.documents.filter(doc => 
      ['dpr', 'feasibility_study', 'compliance_certificate', 'budget_approval', 'tender_rfp'].includes(doc.document_type)
    )
  }, [project?.documents])

  // Filter media files (optional_media and project_image)
  const mediaFiles = useMemo(() => {
    if (!project?.documents) return []
    return project.documents.filter(doc => 
      ['optional_media', 'project_image'].includes(doc.document_type)
    )
  }, [project?.documents])

  // Get project image for banner (for now using fallback, can be enhanced later)
  const projectImageBanner = useMemo(() => {
    // For now, we'll use the fallback. Later we can construct image URL from file_id if backend provides it
    return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1600&h=900&fit=crop&q=80"
  }, [project?.documents])

  // Calculate days left
  const getDaysLeft = (endDate: string | null | undefined) => {
    if (!endDate) return null
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'secondary'
      case 'approved':
      case 'live':
        return 'default'
      case 'completed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // Notes list
  const {
    data: notesResponse,
    isLoading: isNotesLoading,
    isError: isNotesError,
    error: notesError,
  } = useQuery<any, any>({
    queryKey: ['project-notes', project?.organization_id, project?.project_reference_id],
    queryFn: async () => {
      if (!project?.organization_id || !project?.project_reference_id) {
        return []
      }
      const response = await apiService.get('/project-notes/', {
        organization_id: project.organization_id,
        project_reference_id: project.project_reference_id,
      })
      return response?.data || response
    },
    enabled: !!project?.organization_id && !!project?.project_reference_id,
  })

  const notes: ProjectNote[] = Array.isArray(notesResponse)
    ? notesResponse
    : notesResponse?.results || notesResponse?.data || []

  const resetNoteForm = () => {
    setNoteTitle("")
    setNoteContent("")
  }

  const handleCloseNoteDialog = () => {
    resetNoteForm()
    setIsNoteDialogOpen(false)
  }

  const handleOpenFundingDialog = () => {
    if (projectReferenceId) {
      setFundingDialogOpen(true)
    }
  }

  const handleCloseFundingDialog = () => {
    setFundingDialogOpen(false)
    // Invalidate project query to refresh project details after commitment changes
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    }
  }

  const handleOpenRequestDocumentDialog = () => {
    if (projectReferenceId) {
      setRequestDocumentDialogOpen(true)
    }
  }

  const handleCloseRequestDocumentDialog = () => {
    setRequestDocumentDialogOpen(false)
  }

  const handleOpenRequestMeetingDialog = () => {
    if (projectReferenceId) {
      setRequestMeetingDialogOpen(true)
    }
  }

  const handleCloseRequestMeetingDialog = () => {
    setRequestMeetingDialogOpen(false)
  }

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!noteTitle.trim() || !noteContent.trim()) {
        throw new Error("Title and content are required")
      }

      if (!project) {
        throw new Error("Project details are not available")
      }

      const payload = {
        project_reference_id: project.project_reference_id,
        organization_id: project.organization_id,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags: [] as string[],
        created_by: user?.data?.login,
        user_id: user?.data?.login,
      }

      return apiService.post("/project-notes/", payload)
    },
    onSuccess: () => {
      alerts.success("Note Added", "Your note has been added successfully.")
      resetNoteForm()
      setIsNoteDialogOpen(false)
      queryClient.invalidateQueries({
        queryKey: ['project-notes', project?.organization_id, project?.project_reference_id],
      })
    },
    onError: (err: any) => {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to add note. Please try again."
      // Close the main dialog first, then show error alert
      resetNoteForm()
      setIsNoteDialogOpen(false)
      // Use setTimeout to ensure dialog closes before showing error alert
      setTimeout(() => {
        alerts.error("Error", message)
      }, 100)
    },
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/main/projects/live')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Spinner size={24} />
              <span className="text-muted-foreground">Loading project details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (isError || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/main/projects/live')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || "The project you're looking for doesn't exist or has been removed."}
            </p>
            {isError && (
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertDescription>
                  {error?.message || "Failed to load project details. Please try again."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysLeft = getDaysLeft(project.fundraising_end_date)
  const fundingProgress = project.funding_percentage || 
    (parseFloat(project.funding_raised || '0') / parseFloat(project.funding_requirement || '1')) * 100

  return (
    <div className="space-y-6">
      <Dialog open={isNoteDialogOpen} onOpenChange={(open) => !open ? handleCloseNoteDialog() : setIsNoteDialogOpen(true)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a private note for this project. Only you and authorized users will be able to see it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="noteTitle" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="noteTitle"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter note title"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="noteContent" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note here"
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseNoteDialog}
              disabled={createNoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => createNoteMutation.mutate()}
              disabled={createNoteMutation.isPending}
            >
              {createNoteMutation.isPending && <Spinner size={16} className="mr-2" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/main/projects/live')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(project.status)}>
            {project.status}
          </Badge>
          {/* <Badge variant="outline">
            {project.visibility}
          </Badge> */}
        </div>
      </div>

      {/* Project Header with Hero Image */}
      <Card className="overflow-hidden">
        <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700">
          {/* Project Image with Fallback */}
          <img 
            src={projectImageBanner}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, hide it and show gradient background
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              {project.status}
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
                {project.project_reference_id}
              </Badge>
              <Badge variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
                {project.category}
              </Badge>
              <Badge variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
                {project.project_stage}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 drop-shadow-lg line-clamp-2">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
              {project.state && (
                <div className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="truncate max-w-[150px] md:max-w-none">{project.city ? `${project.city}, ${project.state}` : project.state}</span>
                </div>
              )}
              <div className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline">{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                <span className="md:hidden">{formatDate(project.start_date)}</span>
              </div>
              {daysLeft !== null && daysLeft > 0 && (
                <div className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{daysLeft} days left</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs for Details */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="qa">Q&A</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {project.description || "No description available."}
                    </p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Department</div>
                      <div className="font-medium">{project.department || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Organization</div>
                      <div className="font-medium">{project.organization_id || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Project Stage</div>
                      <div className="font-medium capitalize">{project.project_stage || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Category</div>
                      <div className="font-medium">{project.category || "N/A"}</div>
                    </div>
                    {project.funding_type && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Funding Type</div>
                        <div className="font-medium">{project.funding_type}</div>
                      </div>
                    )}
                    {project.mode_of_implementation && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Mode of Implementation</div>
                        <div className="font-medium">{project.mode_of_implementation}</div>
                      </div>
                    )}
                    {project.ownership && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Ownership</div>
                        <div className="font-medium">{project.ownership}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="financials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total Project Cost</div>
                      <div className="text-2xl font-bold">{formatCurrency(project.total_project_cost)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Funding Requirement</div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(project.funding_requirement)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Already Secured</div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(project.already_secured_funds)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Funding Raised</div>
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(project.funding_raised)}</div>
                    </div>
                  </div>
                  
                  {project.commitment_gap && (
                    <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <div className="text-sm text-muted-foreground mb-1">Commitment Gap</div>
                      <div className="text-xl font-bold text-orange-600">{formatCurrency(project.commitment_gap)}</div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Funding Progress</span>
                      <span>{fundingProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={fundingProgress} className="h-3" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Credit Rating</div>
                      <div className="text-xl font-bold text-green-600">{project.municipality_credit_rating || "N/A"}</div>
                      {project.municipality_credit_score && (
                        <div className="text-xs text-muted-foreground">Score: {project.municipality_credit_score}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Currency</div>
                      <div className="text-xl font-bold">{project.currency || "INR"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fundraising Start</div>
                      <div className="font-medium">{formatDate(project.fundraising_start_date)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fundraising End</div>
                      <div className="font-medium">{formatDate(project.fundraising_end_date)}</div>
                    </div>
                  </div>

                  {/* Additional Financial Fields */}
                  {(project.commitment_allocation_days !== null && project.commitment_allocation_days !== undefined) ||
                   (project.minimum_commitment_fulfilment_percentage !== null && project.minimum_commitment_fulfilment_percentage !== undefined) ||
                   (project.tenure !== null && project.tenure !== undefined) ||
                   (project.cut_off_rate_percentage !== null && project.cut_off_rate_percentage !== undefined) ||
                   project.minimum_commitment_amount ||
                   project.conditions ? (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-4">Commitment & Terms</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {project.commitment_allocation_days !== null && project.commitment_allocation_days !== undefined && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Commitment Allocation Days</div>
                              <div className="font-medium">{project.commitment_allocation_days} days</div>
                            </div>
                          )}
                          {project.minimum_commitment_fulfilment_percentage !== null && project.minimum_commitment_fulfilment_percentage !== undefined && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Minimum Commitment Fulfilment</div>
                              <div className="font-medium">{project.minimum_commitment_fulfilment_percentage}%</div>
                            </div>
                          )}
                          {project.tenure !== null && project.tenure !== undefined && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Tenure</div>
                              <div className="font-medium">{project.tenure} months</div>
                            </div>
                          )}
                          {project.cut_off_rate_percentage !== null && project.cut_off_rate_percentage !== undefined && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Cut-off Rate (Minimum Acceptable Interest Rate)</div>
                              <div className="font-medium">{project.cut_off_rate_percentage}% p.a.</div>
                            </div>
                          )}
                          {project.minimum_commitment_amount && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Minimum Commitment Amount</div>
                              <div className="font-medium">{formatCurrency(project.minimum_commitment_amount)}</div>
                            </div>
                          )}
                        </div>
                        {project.conditions && (
                          <div className="mt-4">
                            <div className="text-sm text-muted-foreground mb-2">Conditions</div>
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{project.conditions}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Organization Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Organization Type</div>
                        <div className="font-medium capitalize">{project.organization_type || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Organization ID</div>
                        <div className="font-medium">{project.organization_id || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Contact Person</div>
                        <div className="font-medium">{project.contact_person || "N/A"}</div>
                        {project.contact_person_designation && (
                          <div className="text-xs text-muted-foreground">{project.contact_person_designation}</div>
                        )}
                      </div>
                      {project.contact_person_email && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </div>
                          <div className="font-medium">{project.contact_person_email}</div>
                        </div>
                      )}
                      {project.contact_person_phone && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Phone
                          </div>
                          <div className="font-medium">{project.contact_person_phone}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location Details
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {project.state && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">State</div>
                          <div className="font-medium">{project.state}</div>
                        </div>
                      )}
                      {project.city && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">City</div>
                          <div className="font-medium">{project.city}</div>
                        </div>
                      )}
                      {project.ward && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Ward</div>
                          <div className="font-medium">{project.ward}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Start Date</div>
                        <div className="font-medium">{formatDate(project.start_date)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">End Date</div>
                        <div className="font-medium">{formatDate(project.end_date)}</div>
                      </div>
                    </div>
                  </div>

                  {project.admin_notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Info className="h-5 w-5" />
                          Admin Notes
                        </h3>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm">{project.admin_notes}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No documents available for this project.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc: ProjectDocument) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{doc.file.original_filename || doc.file.filename}</div>
                              <div className="text-sm text-muted-foreground">
                                {getDocumentTypeName(doc.document_type)} • {formatFileSize(doc.file.file_size)} • {formatDate(doc.created_at)}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-4 flex-shrink-0"
                            onClick={() => handleDownloadFile(doc.file.id, doc.file.original_filename || doc.file.filename)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Media</CardTitle>
                </CardHeader>
                <CardContent>
                  {mediaFiles.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No media files available for this project.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {mediaFiles.map((doc: ProjectDocument) => {
                        const isImage = doc.file.mime_type.startsWith('image/')
                        const isVideo = doc.file.mime_type.startsWith('video/')
                        const isAudio = doc.file.mime_type.startsWith('audio/')
                        
                        return (
                          <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="relative flex-shrink-0">
                                {isImage ? (
                                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                    <Image className="h-6 w-6 text-green-600" />
                                  </div>
                                ) : isVideo ? (
                                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center relative">
                                    <Video className="h-6 w-6 text-red-600" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                      <Play className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                ) : isAudio ? (
                                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                    <Mic className="h-6 w-6 text-purple-600" />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {isVideo && <Video className="h-4 w-4 text-red-600 flex-shrink-0" />}
                                  {isImage && <Image className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                  {isAudio && <Mic className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                                  <div className="font-medium truncate">{doc.file.original_filename || doc.file.filename}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {getDocumentTypeName(doc.document_type)} • {formatFileSize(doc.file.file_size)} • {formatDate(doc.created_at)}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="ml-4 flex-shrink-0"
                              onClick={() => handleDownloadFile(doc.file.id, doc.file.original_filename || doc.file.filename)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="qa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Questions & Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isQuestionsError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {questionsError?.message || "Failed to load questions. Please try again."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {isQuestionsLoading ? (
                      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                        <Spinner className="mr-2" size={16} />
                        Loading questions...
                      </div>
                    ) : questions.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No questions have been asked for this project yet. Be the first to ask.
                      </div>
                    ) : (
                      questions.map((qa) => {
                        const answer = getDisplayAnswer(qa)
                        const canEditOrDeleteQuestion = qa.asked_by === currentUserId && !answer
                        const hasAnswer = Boolean(answer)

                        return (
                          <div
                            key={qa.id}
                            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                                  {qa.asked_by?.charAt(0).toUpperCase?.() || "Q"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-medium mb-1">
                                      {qa.question_text}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-2">
                                      Asked by{" "}
                                      <span className="font-medium">{qa.asked_by}</span>
                                      {qa.priority && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                          {qa.priority}
                                        </span>
                                      )}
                                      {qa.category && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                          {qa.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {canEditOrDeleteQuestion && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setEditingQuestion(qa)
                                            setQuestionText(qa.question_text)
                                            setQuestionCategory(qa.category || "")
                                            setQuestionPriority(qa.priority || "normal")
                                            setIsAskDialogOpen(true)
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => deleteQuestionMutation.mutate(qa)}
                                          disabled={deleteQuestionMutation.isPending}
                                        >
                                          Delete
                                        </Button>
                                      </>
                                    )}

                                    {isMunicipalityUser && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setAnsweringQuestion(qa)
                                          const existingAnswer = getDisplayAnswer(qa)
                                          setAnswerText(existingAnswer?.reply_text || "")
                                          setAnswerDocumentLinks(existingAnswer?.document_links || "")
                                          setIsAnswerDialogOpen(true)
                                        }}
                                      >
                                        {hasAnswer ? "Edit Answer" : "Answer"}
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {hasAnswer ? (
                                  <div className="bg-muted p-4 rounded-lg border-l-4 border-l-green-500 mt-2">
                                    <div className="flex items-start space-x-3">
                                      <Avatar>
                                        <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                                          {String(
                                            answer?.replied_by_user_id || "A",
                                          )
                                            .charAt(0)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                          <div className="font-medium text-sm">
                                            Answered by{" "}
                                            {answer?.replied_by_user_id || "Municipality"}
                                          </div>
                                        </div>
                                        <div className="text-sm leading-relaxed">
                                          {answer?.reply_text}
                                        </div>
                                        {answer?.document_links && (
                                          <div className="mt-2 text-xs text-blue-600 underline break-all">
                                            {answer.document_links}
                                          </div>
                                        )}
                                        {answer?.documents && answer.documents.length > 0 && (
                                          <div className="mt-3 space-y-2">
                                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                              Attached Documents:
                                            </div>
                                            {answer.documents.map((doc) => (
                                              <div
                                                key={doc.id}
                                                className="flex items-center justify-between p-2 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                                              >
                                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded flex-shrink-0">
                                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium truncate">
                                                      {doc.file.original_filename || doc.file.filename}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      {formatFileSize(doc.file.file_size)}
                                                    </div>
                                                  </div>
                                                </div>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="ml-2 flex-shrink-0 h-7 px-2"
                                                  onClick={() =>
                                                    handleDownloadFile(
                                                      doc.file.id,
                                                      doc.file.original_filename || doc.file.filename
                                                    )
                                                  }
                                                >
                                                  <Download className="h-3 w-3 mr-1" />
                                                  <span className="text-xs">Download</span>
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    This question has not been answered yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div className="pt-4 border-t">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          resetQuestionForm()
                          setIsAskDialogOpen(true)
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ask a Question
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding Actions */}
          {user?.data?.activeBranch === "Lender" && (
          <Card>
            <CardHeader>
              <CardTitle>Funding Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleOpenFundingDialog}
                disabled={!projectReferenceId}
              >
                <IndianRupee className="h-4 w-4 mr-2" />
                Fund This Project
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  Favorite
                </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsNoteDialogOpen(true)}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleOpenRequestDocumentDialog}
                  disabled={!projectReferenceId}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Request Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleOpenRequestMeetingDialog}
                  disabled={!projectReferenceId}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Project Reference ID</div>
                <div className="font-medium">{project.project_reference_id}</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-1">Created</div>
                <div className="font-medium text-sm">{formatDate(project.created_at)}</div>
                <div className="text-xs text-muted-foreground">by {project.created_by}</div>
              </div>
              {project.updated_at && project.updated_at !== project.created_at && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Last Updated</div>
                    <div className="font-medium text-sm">{formatDate(project.updated_at)}</div>
                    {project.updated_by && (
                      <div className="text-xs text-muted-foreground">by {project.updated_by}</div>
                    )}
                  </div>
                </>
              )}
              {project.approved_at && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Approved</div>
                    <div className="font-medium text-sm">{formatDate(project.approved_at)}</div>
                    {project.approved_by && (
                      <div className="text-xs text-muted-foreground">by {project.approved_by}</div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Credit Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {project.municipality_credit_rating || "N/A"}
                  </div> 
                  <div className="text-sm text-muted-foreground">Credit Rating</div>
                  {project.municipality_credit_score && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {project.municipality_credit_score}
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full">
                  View Municipal Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Project Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Project Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isNotesError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {notesError?.message || "Failed to load notes. Please try again."}
                  </AlertDescription>
                </Alert>
              )}
              {isNotesLoading ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Spinner size={20} className="mr-2" />
                  Loading notes...
                </div>
              ) : !isNotesError && notes.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No notes have been added for this project yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3 bg-muted/40">
                      <div className="text-sm font-semibold mb-1 line-clamp-2">
                        {note.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-3">
                        {note.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Q&A: Ask Question Dialog */}
      <Dialog
        open={isAskDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetQuestionForm()
          }
          setIsAskDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Ask a Question"}
            </DialogTitle>
            <DialogDescription>
              Submit a question to the municipality about this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="question-text">Question *</Label>
              <Textarea
                id="question-text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question about this project"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={questionCategory}
                  onValueChange={setQuestionCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={questionPriority}
                  onValueChange={setQuestionPriority}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetQuestionForm()
                setIsAskDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingQuestion) {
                  updateQuestionMutation.mutate()
                } else {
                  createQuestionMutation.mutate()
                }
              }}
              disabled={
                createQuestionMutation.isPending || updateQuestionMutation.isPending
              }
            >
              {createQuestionMutation.isPending || updateQuestionMutation.isPending
                ? "Saving..."
                : editingQuestion
                ? "Update Question"
                : "Submit Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Municipality-only: Answer Question Dialog */}
      {isMunicipalityUser && (
        <Dialog
          open={isAnswerDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetAnswerForm()
            }
            setIsAnswerDialogOpen(open)
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {getDisplayAnswer(answeringQuestion)
                  ? "Edit Answer"
                  : "Answer Question"}
              </DialogTitle>
              <DialogDescription>
                Provide a single authoritative answer for this question.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Question</Label>
                <p className="text-sm text-muted-foreground">
                  {answeringQuestion?.question_text}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="answer-text">Answer *</Label>
                <Textarea
                  id="answer-text"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Enter your answer for this question"
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="answer-doc-links">Document links (optional)</Label>
                <Input
                  id="answer-doc-links"
                  value={answerDocumentLinks}
                  onChange={(e) => setAnswerDocumentLinks(e.target.value)}
                  placeholder="https://example.com/answer-details"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetAnswerForm()
                  setIsAnswerDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => upsertAnswerMutation.mutate()}
                disabled={upsertAnswerMutation.isPending}
              >
                {upsertAnswerMutation.isPending ? "Saving..." : "Save Answer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Funding Commitment Dialog */}
      <FundingCommitmentDialog
        open={fundingDialogOpen}
        project_reference_id={projectReferenceId || null}
        onClose={handleCloseFundingDialog}
      />

      {/* Request Document Dialog */}
      <RequestDocumentDialog
        open={requestDocumentDialogOpen}
        project_reference_id={projectReferenceId || null}
        onClose={handleCloseRequestDocumentDialog}
      />

      {/* Request Meeting Dialog */}
      <RequestMeetingDialog
        open={requestMeetingDialogOpen}
        project_reference_id={projectReferenceId || null}
        onClose={handleCloseRequestMeetingDialog}
      />
    </div>
  )
}
