import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Image,
  Upload,
  X,
  CheckCircle2,
  TrendingUp,
  FileImage,
  FileVideo,
  File
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
import { apiService, api } from '@/services/api'
import { alerts } from '@/lib/alerts'
import { useAuth } from '@/contexts/auth-context'

interface ProgressUpdate {
  id: number
  project_reference_id: string
  milestone_title: string
  description: string
  completion_percentage: number | null
  date_achieved: string
  created_at: string
  created_by: string
  media_files?: MediaFile[]
}

interface MediaFile {
  id: number
  file_id: number
  file_type: 'image' | 'video' | 'document'
  file: {
    id: number
    filename: string
    original_filename: string
    mime_type: string
    file_size: number
  }
}

interface ProjectInfo {
  id: number
  project_reference_id: string
  title: string
  status: string
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


export default function ProjectProgressUpdate() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // const queryClient = useQueryClient() // Uncomment when backend is ready
  const { user } = useAuth()
  
  const projectReferenceId = location.state?.projectReferenceId || ''
  const currentUserId = user?.data?.login

  // Form state
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [description, setDescription] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState<string>('')
  const [dateAchieved, setDateAchieved] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  
  // Validation errors
  const [errors, setErrors] = useState<{
    milestoneTitle?: string
    description?: string
    completionPercentage?: string
    dateAchieved?: string
  }>({})

  // Fetch project info
  const { data: projectData, isLoading: isLoadingProject } = useQuery<any, any>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null
      const response = await apiService.get(`/projects/${id}`)
      return response?.data || response
    },
    enabled: !!id,
  })

  const project: ProjectInfo | undefined = projectData

  // Dummy progress updates data (no backend call)
  const progressUpdates: ProgressUpdate[] = useMemo(() => {
    const refId = projectReferenceId || project?.project_reference_id || 'PROJ-001'
    
    return [
      {
        id: 1,
        project_reference_id: refId,
        milestone_title: 'Phase 1 Completed',
        description: 'Successfully completed Phase 1 of the project. All foundation work has been completed, including site preparation, excavation, and initial structural framework. The project is progressing well and on schedule.',
        completion_percentage: 35,
        date_achieved: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'municipality_user',
        media_files: [
          {
            id: 1,
            file_id: 101,
            file_type: 'image',
            file: {
              id: 101,
              filename: 'phase1-completion.jpg',
              original_filename: 'Phase 1 Completion Photo.jpg',
              mime_type: 'image/jpeg',
              file_size: 2048576
            }
          },
          {
            id: 2,
            file_id: 102,
            file_type: 'video',
            file: {
              id: 102,
              filename: 'phase1-progress.mp4',
              original_filename: 'Phase 1 Progress Video.mp4',
              mime_type: 'video/mp4',
              file_size: 15728640
            }
          }
        ]
      },
      {
        id: 2,
        project_reference_id: refId,
        milestone_title: 'Infrastructure Setup Complete',
        description: 'All necessary infrastructure including water supply, electricity connections, and road access has been successfully established. The site is now fully operational and ready for next phase construction activities.',
        completion_percentage: 25,
        date_achieved: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'municipality_user',
        media_files: [
          {
            id: 3,
            file_id: 103,
            file_type: 'image',
            file: {
              id: 103,
              filename: 'infrastructure-setup.jpg',
              original_filename: 'Infrastructure Setup.jpg',
              mime_type: 'image/jpeg',
              file_size: 1536000
            }
          }
        ]
      },
      {
        id: 3,
        project_reference_id: refId,
        milestone_title: 'Project Kickoff',
        description: 'Project officially kicked off with ground-breaking ceremony. All stakeholders were present including local officials, contractors, and community representatives. Initial site survey and planning completed successfully.',
        completion_percentage: 10,
        date_achieved: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'municipality_user',
        media_files: [
          {
            id: 4,
            file_id: 104,
            file_type: 'image',
            file: {
              id: 104,
              filename: 'kickoff-ceremony.jpg',
              original_filename: 'Kickoff Ceremony.jpg',
              mime_type: 'image/jpeg',
              file_size: 3072000
            }
          },
          {
            id: 5,
            file_id: 105,
            file_type: 'image',
            file: {
              id: 105,
              filename: 'site-survey.jpg',
              original_filename: 'Site Survey.jpg',
              mime_type: 'image/jpeg',
              file_size: 1024000
            }
          }
        ]
      }
    ]
  }, [projectReferenceId, project?.project_reference_id])

  const isLoadingUpdates = false
  const isUpdatesError = false

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newFiles = [...mediaFiles, ...files]
    setMediaFiles(newFiles)

    // Create preview URLs
    const newPreviewUrls = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
      }
      return ''
    })
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
  }

  const removeFile = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    
    // Revoke object URLs
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    
    setMediaFiles(newFiles)
    setPreviewUrls(newPreviewUrls)
  }

  // Validation
  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!milestoneTitle.trim()) {
      newErrors.milestoneTitle = 'Milestone title is required'
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (completionPercentage) {
      const percentage = parseFloat(completionPercentage)
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        newErrors.completionPercentage = 'Completion percentage must be between 0 and 100'
      }
    }

    if (!dateAchieved) {
      newErrors.dateAchieved = 'Date achieved is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Create progress update mutation
  const createProgressUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error('Please fix validation errors')
      }

      const refId = projectReferenceId || project?.project_reference_id
      if (!refId) {
        throw new Error('Project reference ID is required')
      }

      // Prepare form data for file upload
      const formData = new FormData()
      formData.append('project_reference_id', refId)
      formData.append('milestone_title', milestoneTitle.trim())
      formData.append('description', description.trim())
      if (completionPercentage) {
        formData.append('completion_percentage', completionPercentage)
      }
      formData.append('date_achieved', dateAchieved)
      formData.append('created_by', currentUserId || '')

      // Append media files
      mediaFiles.forEach((file) => {
        formData.append(`media_files`, file)
      })

      // Use axios directly for FormData
      const response = await api.post('/project-progress-updates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    },
    onSuccess: () => {
      alerts.success('Progress Update Submitted', 'Your progress update has been submitted successfully.')
      resetForm()
      // Note: Since we're using dummy data, we don't need to invalidate queries
      // In production, uncomment the line below when backend is ready:
      // queryClient.invalidateQueries({ 
      //   queryKey: ['project-progress-updates', projectReferenceId || project?.project_reference_id] 
      // })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to submit progress update. Please try again.'
      alerts.error('Error', message)
    },
  })

  const resetForm = () => {
    setMilestoneTitle('')
    setDescription('')
    setCompletionPercentage('')
    setDateAchieved('')
    setMediaFiles([])
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    setPreviewUrls([])
    setErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      createProgressUpdateMutation.mutate()
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    return File
  }

  if (isLoadingProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size={24} />
          <span className="ml-2 text-muted-foreground">Loading project details...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Project not found. Please go back and try again.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/main/municipal/projects/progress')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-1">
            Project Reference: {project.project_reference_id}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/main/municipal/projects/progress')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Add Progress Update
              </CardTitle>
              <CardDescription>
                Submit a milestone update with details about work completed and progress made.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Milestone Title */}
                <div className="space-y-2">
                  <Label htmlFor="milestoneTitle">
                    Milestone Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="milestoneTitle"
                    value={milestoneTitle}
                    onChange={(e) => {
                      setMilestoneTitle(e.target.value)
                      if (errors.milestoneTitle) {
                        setErrors({ ...errors, milestoneTitle: undefined })
                      }
                    }}
                    placeholder="e.g., Phase 1 Completed"
                    className={errors.milestoneTitle ? 'border-destructive' : ''}
                  />
                  {errors.milestoneTitle && (
                    <p className="text-sm text-destructive">{errors.milestoneTitle}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (errors.description) {
                        setErrors({ ...errors, description: undefined })
                      }
                    }}
                    placeholder="Describe the work done, progress made, and any important details..."
                    rows={6}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters required
                  </p>
                </div>

                {/* Completion Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="completionPercentage">
                    Completion Percentage (%)
                  </Label>
                  <Input
                    id="completionPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={completionPercentage}
                    onChange={(e) => {
                      setCompletionPercentage(e.target.value)
                      if (errors.completionPercentage) {
                        setErrors({ ...errors, completionPercentage: undefined })
                      }
                    }}
                    placeholder="e.g., 45.5"
                    className={errors.completionPercentage ? 'border-destructive' : ''}
                  />
                  {errors.completionPercentage && (
                    <p className="text-sm text-destructive">{errors.completionPercentage}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Optional: Enter the percentage of project completion
                  </p>
                </div>

                {/* Date Achieved */}
                <div className="space-y-2">
                  <Label htmlFor="dateAchieved">
                    Date Achieved <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateAchieved"
                    type="date"
                    value={dateAchieved}
                    onChange={(e) => {
                      setDateAchieved(e.target.value)
                      if (errors.dateAchieved) {
                        setErrors({ ...errors, dateAchieved: undefined })
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.dateAchieved ? 'border-destructive' : ''}
                  />
                  {errors.dateAchieved && (
                    <p className="text-sm text-destructive">{errors.dateAchieved}</p>
                  )}
                </div>

                {/* Media Uploads */}
                <div className="space-y-2">
                  <Label htmlFor="mediaFiles">
                    Media Uploads (Photos, Videos)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="mediaFiles"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload photos or videos showing the progress (optional)
                  </p>

                  {/* File Previews */}
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {mediaFiles.map((file, index) => {
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/main/municipal/projects/progress')}
                    disabled={createProgressUpdateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProgressUpdateMutation.isPending}
                  >
                    {createProgressUpdateMutation.isPending ? (
                      <>
                        <Spinner className="mr-2" size={16} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Update
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Progress History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress History</CardTitle>
              <CardDescription>
                Previous progress updates for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUpdates ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size={20} />
                </div>
              ) : isUpdatesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load progress updates
                  </AlertDescription>
                </Alert>
              ) : progressUpdates.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No progress updates yet. Be the first to add one!
                </div>
              ) : (
                <div className="space-y-4">
                  {progressUpdates.map((update, idx) => (
                    <div key={update.id} className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm">{update.milestone_title}</h4>
                          {idx === 0 && (
                            <Badge variant="default" className="text-xs">Latest</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {update.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(update.date_achieved)}
                          </div>
                          {update.completion_percentage !== null && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {update.completion_percentage}% complete
                            </div>
                          )}
                        </div>
                        {update.media_files && update.media_files.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Image className="h-3 w-3" />
                            {update.media_files.length} media file(s)
                          </div>
                        )}
                      </div>
                      {idx < progressUpdates.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

