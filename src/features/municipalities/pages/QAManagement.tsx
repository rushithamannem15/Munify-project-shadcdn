import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable, type ColumnDef } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageCircle, CheckCircle, Clock, ArrowUpDown, MessageSquare, MoreHorizontal, Edit, Trash2, File, Download, X } from "lucide-react"
import apiService, { api } from "@/services/api"
import { alerts } from "@/lib/alerts"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"

// UI Question interface
interface Question {
  id: number
  projectId: string
  projectReferenceId: string
  question: string
  askedBy: string
  category: string
  askedDate: string
  answeredDate?: string
  answer?: string
  answeredBy?: string
  documentLinks?: string
  status: 'open' | 'answered'
}


export default function QAManagement() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'answered'>('all')
  
  // Answer/Edit dialog state
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [answeringQuestion, setAnsweringQuestion] = useState<Question | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [answerFiles, setAnswerFiles] = useState<File[]>([])
  const [existingDocuments, setExistingDocuments] = useState<any[]>([])
  
  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null)

  const ORGANIZATION_ID = user?.data?.userBranches[1]?.branchId // Pune Municipal Corporation
  const CURRENT_USER_ID = user?.data?.login
  
  // Fetch questions from API
  const { data: questionsResponse, isLoading, error, isError } = useQuery({
    queryKey: ['questions', { organization_id: ORGANIZATION_ID }],
    queryFn: async () => {
      if (!ORGANIZATION_ID) {
        throw new Error("Organization ID is required")
      }
      try {
        return await apiService.get('/questions', {
          organization_id: ORGANIZATION_ID,
          skip: 0,
          limit: 50,
        })
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Failed to load questions"
        alerts.error("Error", message)
        throw err
      }
    },
    enabled: !isAuthLoading && !!ORGANIZATION_ID, // Only run query when auth is loaded and ORGANIZATION_ID exists
  })

  // Map API response to UI Question format
  const allQuestions: Question[] = useMemo(() => {
    // Handle API response structure (data may be array or object with data property)
    const questionsData = Array.isArray(questionsResponse) 
      ? questionsResponse 
      : questionsResponse?.data || []
    
    if (!questionsData || questionsData.length === 0) return []
    
    return questionsData.map((qa: any) => {
      const hasAnswer = qa.answer?.reply_text || qa.reply_text
      const status: 'open' | 'answered' = hasAnswer ? 'answered' : 'open'
      
      return {
        id: qa.id,
        projectId: qa.project_id,
        projectReferenceId: qa.project_reference_id || qa.project_id,
        question: qa.question_text,
        askedBy: qa.asked_by,
        category: qa.category || 'General',
        askedDate: qa.created_at || '',
        answeredDate: qa.answer?.created_at || (qa.updated_at && hasAnswer ? qa.updated_at : undefined),
        answer: qa.answer?.reply_text || qa.reply_text,
        answeredBy: qa.answer?.replied_by_user_id?.toString() || qa.replied_by_user_id?.toString(),
        documentLinks: qa.answer?.document_links || qa.document_links || undefined,
        status,
      }
    })
  }, [questionsResponse])

  // Filter questions based on active tab
  const questions = useMemo(() => {
    if (activeTab === 'open') {
      return allQuestions.filter(q => q.status === 'open')
    }
    if (activeTab === 'answered') {
      return allQuestions.filter(q => q.status === 'answered')
    }
    return allQuestions
  }, [activeTab, allQuestions])

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalQuestions: allQuestions.length,
      openQuestions: allQuestions.filter(q => q.status === 'open').length,
      answeredQuestions: allQuestions.filter(q => q.status === 'answered').length
    }
  }, [allQuestions])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: 'open' | 'answered') => {
    if (status === 'open') {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> Open
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 inline-flex items-center gap-1">
        <CheckCircle className="h-3 w-3" /> Answered
      </Badge>
    )
  }

  // Fetch question details when editing
  const { data: questionDetails, isLoading: isLoadingQuestionDetails } = useQuery({
    queryKey: ['question-details', answeringQuestion?.id, answeringQuestion?.projectReferenceId],
    queryFn: async () => {
      if (!answeringQuestion?.id || !answeringQuestion?.projectReferenceId) return null
      try {
        const response = await apiService.get(`/questions/${answeringQuestion.id}`, {
          project_id: answeringQuestion.projectReferenceId
        })
        return response?.data || response
      } catch (err: any) {
        console.error('Error fetching question details:', err)
        return null
      }
    },
    enabled: isEditMode && !!answeringQuestion?.id && !!answeringQuestion?.projectReferenceId,
  })

  // Update existing documents when question details are loaded
  useEffect(() => {
    // Handle API response structure: response.data.data.answer.documents
    const answerData = questionDetails?.data?.answer || questionDetails?.answer
    if (answerData?.documents && Array.isArray(answerData.documents) && answerData.documents.length > 0) {
      setExistingDocuments(answerData.documents)
    } else {
      setExistingDocuments([])
    }
  }, [questionDetails])

  const resetAnswerForm = () => {
    setAnswerText("")
    setAnswerFiles([])
    setExistingDocuments([])
    setAnsweringQuestion(null)
    setIsEditMode(false)
  }

  const openAnswerDialog = (question: Question) => {
    setAnsweringQuestion(question)
    setAnswerText("")
    setAnswerFiles([])
    setExistingDocuments([])
    setIsEditMode(false)
    setIsAnswerDialogOpen(true)
  }

  const openEditDialog = (question: Question) => {
    setAnsweringQuestion(question)
    setAnswerText(question.answer || "")
    setAnswerFiles([])
    setIsEditMode(true)
    setIsAnswerDialogOpen(true)
    // Documents will be loaded via the query when dialog opens
  }

  const openDeleteDialog = (question: Question) => {
    setDeletingQuestion(question)
    setIsDeleteDialogOpen(true)
  }

  // Helper function to format file size
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
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      })

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

  // Handle file selection
  const handleFileChange = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)
    setAnswerFiles(prev => [...prev, ...newFiles])
  }

  // Remove file from upload list
  const removeFile = (index: number) => {
    setAnswerFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Remove existing document from the list
  const removeExistingDocument = (docId: number) => {
    setExistingDocuments(prev => prev.filter(doc => doc.id !== docId))
  }

  // Mutation for answering/editing questions
  const answerQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!answeringQuestion) {
        throw new Error("No question selected for answer")
      }
      if (!answerText.trim()) {
        throw new Error("Answer text is required")
      }

      const formData = new FormData()
      formData.append('reply_text', answerText.trim())
      
      // Always send files as a list/array:
      // - Single file: files: [file1.pdf] (as a list)
      // - Multiple files: files: [file1.pdf, file2.jpg] (as a list)
      // - No files: omit the field (backend handles empty array)
      // FormData automatically creates an array when multiple values are appended with the same key
      if (answerFiles.length > 0) {
        answerFiles.forEach((file) => {
          formData.append('files', file)
        })
      }
      // If no files, we omit the 'files' field entirely

      const endpoint = `/questions/${answeringQuestion.id}/answer?project_id=${encodeURIComponent(
        answeringQuestion.projectId
      )}&replied_by_user_id=${encodeURIComponent(CURRENT_USER_ID)}`

      // Use PUT for edit, POST for new answer
      if (isEditMode) {
        return await apiService.put(endpoint, formData)
      }
      return await apiService.post(endpoint, formData)
    },
    onSuccess: () => {
      alerts.success(isEditMode ? "Answer Updated" : "Answer Saved", 
        isEditMode ? "The answer has been updated successfully." : "The answer has been saved successfully.")
      resetAnswerForm()
      setIsAnswerDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['questions', { organization_id: ORGANIZATION_ID }] })
      if (answeringQuestion?.id) {
        queryClient.invalidateQueries({ queryKey: ['question-details', answeringQuestion.id] })
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        isEditMode ? "Failed to update answer. Please try again." : "Failed to save answer. Please try again."
      // Close the main dialog first, then show error alert
      resetAnswerForm()
      setIsAnswerDialogOpen(false)
      // Use setTimeout to ensure dialog closes before showing error alert
      setTimeout(() => {
        alerts.error("Error", message)
      }, 100)
    },
  })

  // Mutation for deleting answers
  const deleteAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!deletingQuestion) {
        throw new Error("No question selected for deletion")
      }

      const endpoint = `/questions/${deletingQuestion.id}/answer?project_id=${encodeURIComponent(
        deletingQuestion.projectId
      )}&replied_by_user_id=${encodeURIComponent(CURRENT_USER_ID)}`

      return await apiService.delete(endpoint)
    },
    onSuccess: () => {
      alerts.success("Answer Deleted", "The answer has been deleted. Question is now open.")
      setDeletingQuestion(null)
      setIsDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['questions', { organization_id: ORGANIZATION_ID }] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete answer. Please try again."
      // Close the main dialog first, then show error alert
      setDeletingQuestion(null)
      setIsDeleteDialogOpen(false)
      // Use setTimeout to ensure dialog closes before showing error alert
      setTimeout(() => {
        alerts.error("Error", message)
      }, 100)
    },
  })

  // Define columns for DataTable
  const columns: ColumnDef<Question, any>[] = useMemo(() => [
    {
      id: 'sno',
      header: () => (
        <span className="text-sm font-semibold text-foreground">SNO</span>
      ),
      cell: ({ row, table }) => {
        const rowIndex = table.getRowModel().rows.indexOf(row)
        return (
          <span className="font-medium text-foreground">{rowIndex + 1}</span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'question',
      header: () => (
        <span className="text-sm font-semibold text-foreground">Question</span>
      ),
      cell: ({ row }) => (
        <div className="min-w-[300px] max-w-[500px]">
          <div className="font-medium text-foreground">{row.original.question}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {row.original.category}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'projectReferenceId',
      header: ({ column }) => (
        <button 
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Project Reference ID
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <span className="font-medium text-foreground">{row.original.projectReferenceId}</span>
        </div>
      ),
    },
    {
      accessorKey: 'askedBy',
      header: ({ column }) => (
        <button 
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Asked By
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <span className="font-medium text-foreground">{row.original.askedBy}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => (
        <span className="text-sm font-semibold text-foreground">Status</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center min-w-[120px]">
          {getStatusBadge(row.original.status)}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'askedDate',
      header: ({ column }) => (
        <button 
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Asked
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDate(row.original.askedDate)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'answeredDate',
      header: ({ column }) => (
        <button 
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Answered
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          {row.original.answeredDate ? (
            <>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(row.original.answeredDate)}
              </span>
              {row.original.answeredBy && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  by {row.original.answeredBy}
                </div>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <span className="text-sm font-semibold text-foreground">Actions</span>
      ),
      cell: ({ row }) => {
        const question = row.original
        const isOpen = question.status === 'open'
        const isAnswered = question.status === 'answered'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-muted transition-colors"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openAnswerDialog(question)}
                disabled={!isOpen}
                className="cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Answer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openEditDialog(question)}
                disabled={!isAnswered}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(question)}
                disabled={!isAnswered}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableHiding: false,
    },
  ], [openAnswerDialog, openEditDialog, openDeleteDialog])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Q&A Management</h1>
          <p className="text-muted-foreground mt-1.5">
            Manage and respond to questions asked by organizations
          </p>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Failed to fetch questions. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {(isAuthLoading || isLoading) && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading questions...</div>
        </div>
      )}

      {/* Stats Overview */}
      {!isAuthLoading && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Questions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalQuestions}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Open Questions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.openQuestions}</p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Answered Questions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.answeredQuestions}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for All Questions, Open Questions, and Answered Questions */}
      {!isAuthLoading && !isLoading && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'open' | 'answered')} className="w-full">
        <div className="border-b border-border">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-none bg-transparent p-0 w-auto gap-1">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 h-11 rounded-none border-b-2 border-transparent bg-transparent px-5 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-indigo-300 hover:text-foreground data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:font-semibold"
            >
              <span>All Questions</span>
              {stats.totalQuestions > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-600">
                  {stats.totalQuestions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="open" 
              className="flex items-center gap-2 h-11 rounded-none border-b-2 border-transparent bg-transparent px-5 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-amber-300 hover:text-foreground data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:font-semibold"
            >
              <span>Open Questions</span>
              {stats.openQuestions > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700 animate-pulse data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:border-amber-500 data-[state=active]:animate-none">
                  {stats.openQuestions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="answered" 
              className="flex items-center gap-2 h-11 rounded-none border-b-2 border-transparent bg-transparent px-5 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-green-300 hover:text-foreground data-[state=active]:border-green-500 data-[state=active]:text-green-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:font-semibold"
            >
              <span>Answered Questions</span>
              {stats.answeredQuestions > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:border-green-500">
                  {stats.answeredQuestions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* All Questions Tab */}
        <TabsContent value="all" className="space-y-4 mt-6">
          {questions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">No questions found</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Questions asked by organizations will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable<Question, any>
              title="All Questions"
              description="Manage and monitor all questions asked by organizations"
              columns={columns}
              data={questions}
              showToolbar={true}
              showFooter={true}
              enableExport={true}
              exportFilename="all-questions.csv"
              globalFilterPlaceholder="Search questions, organizations..."
            />
          )}
        </TabsContent>

        {/* Open Questions Tab */}
        <TabsContent value="open" className="space-y-4 mt-6">
          {questions.length === 0 ? (
            <Card className="border-dashed border-amber-200 dark:border-amber-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">No open questions</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    All questions have been answered. New questions from organizations will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable<Question, any>
              title="Open Questions"
              description="Unanswered questions that require your response"
              columns={columns}
              data={questions}
              showToolbar={true}
              showFooter={true}
              enableExport={true}
              exportFilename="open-questions.csv"
              globalFilterPlaceholder="Search open questions..."
            />
          )}
        </TabsContent>

        {/* Answered Questions Tab */}
        <TabsContent value="answered" className="space-y-4 mt-6">
          {questions.length === 0 ? (
            <Card className="border-dashed border-green-200 dark:border-green-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">No answered questions</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Questions that have been answered will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable<Question, any>
              title="Answered Questions"
              description="Questions that have been answered and resolved"
              columns={columns}
              data={questions}
              showToolbar={true}
              showFooter={true}
              enableExport={true}
              exportFilename="answered-questions.csv"
              globalFilterPlaceholder="Search answered questions..."
            />
          )}
        </TabsContent>
      </Tabs>
      )}

      {/* Answer Question Dialog */}
      <Dialog
        open={isAnswerDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetAnswerForm()
          }
          setIsAnswerDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Answer" : "Answer Question"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update the answer for this question."
                : "Provide a single authoritative answer for this question."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Question</Label>
              <p className="text-sm text-muted-foreground">
                {answeringQuestion?.question}
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
                disabled={answerQuestionMutation.isPending || (isEditMode && isLoadingQuestionDetails)}
              />
            </div>

            {/* Existing Documents Section (Edit Mode Only) */}
            {isEditMode && (
              <div className="space-y-2 pt-2 border-t">
                <Label>Existing Documents</Label>
                {isLoadingQuestionDetails ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner size={16} />
                    Loading documents...
                  </div>
                ) : existingDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {existingDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <File className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc.file?.original_filename || 'Unknown file'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.file?.file_size ? formatFileSize(doc.file.file_size) : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(doc.file?.id, doc.file?.original_filename || 'file')}
                            className="flex-shrink-0"
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingDocument(doc.id)}
                            disabled={answerQuestionMutation.isPending}
                            className="flex-shrink-0 text-destructive hover:text-destructive"
                            title="Delete document"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents attached</p>
                )}
              </div>
            )}

            {/* File Upload Section - Only show if no existing documents (for edit mode) or always for answer mode */}
            {(!isEditMode || existingDocuments.length === 0) && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="answer-files">Documents (optional)</Label>
                <Input
                  id="answer-files"
                  type="file"
                  multiple
                  onChange={(e) => {
                    handleFileChange(e.target.files)
                    e.target.value = '' // Reset input to allow selecting same file again
                  }}
                  disabled={answerQuestionMutation.isPending || (isEditMode && isLoadingQuestionDetails)}
                />
                <p className="text-xs text-muted-foreground">
                  You can upload multiple documents. Click "Choose File" again to add more.
                </p>

                {/* Files to Upload List */}
                {answerFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {answerFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <File className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={answerQuestionMutation.isPending}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetAnswerForm()
                setIsAnswerDialogOpen(false)
              }}
              disabled={answerQuestionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => answerQuestionMutation.mutate()}
              disabled={answerQuestionMutation.isPending || (isEditMode && isLoadingQuestionDetails)}
            >
              {answerQuestionMutation.isPending 
                ? (isEditMode ? "Updating..." : "Saving...") 
                : (isEditMode ? "Update Answer" : "Save Answer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Answer Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Answer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this answer? The question will become open again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Question: <span className="font-medium text-foreground">{deletingQuestion?.question}</span>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingQuestion(null)
                setIsDeleteDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAnswerMutation.mutate()}
              disabled={deleteAnswerMutation.isPending}
            >
              {deleteAnswerMutation.isPending ? "Deleting..." : "Delete Answer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

