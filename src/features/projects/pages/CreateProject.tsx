import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, FileText, DollarSign, Image as ImageIcon, MapPin, User, Building2, X, Video, File, CheckCircle2, Circle, ChevronLeft, ChevronRight, Check, ChevronDown, AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DatePicker } from '@/components/ui/date-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Spinner } from '@/components/ui/spinner'
import { alerts } from '@/lib/alerts'
import apiService, { api } from '@/services/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

// API Response Types
interface ProjectCategory {
  id: number
  value: string
}

interface ProjectStage {
  id: number
  value: string
}

interface FundingType {
  id: number
  value: string
}

interface ModeOfImplementation {
  id: number
  value: string
}

interface Ownership {
  id: number
  value: string
}

interface FormData {
  // Project Identification
  projectTitle: string
  projectReferenceId: string // System-generated, display only
  municipalityId: string
  department: string
  contactPersonName: string
  contactPersonDesignation: string
  contactPersonEmail: string
  contactPersonPhone: string

  // Project Overview
  category: string // Will store the category value from API
  stage: string // Will store the stage value from API
  description: string
  startDate: string
  endDate: string
  fundingType: string // Funding Type from Munify master
  commitmentAllocationDays: string // Default 7 days
  minimumCommitmentFulfilmentPercentage: string // Percentage
  modeOfImplementation: string // Mode of Implementation from mode master
  ownership: string // Ownership from Munify master

  // Financial Information
  totalProjectCost: string
  fundingRequirement: string
  alreadySecuredFunds: string
  fundraisingStartDate: string
  fundraisingEndDate: string
  municipalityCreditRating: string
  municipalityCreditScore: string
  tenure: string // Loan tenure / repayment period
  cutOffRatePercentage: string // Minimum acceptable interest rate
  minimumCommitmentAmount: string
  conditions: string // Mandatory terms set by Municipality

  // Location
  state: string
  city: string
  ward: string

  // Documentation (File objects for new uploads)
  dprFile: File | null
  feasibilityStudyFile: File | null
  complianceCertificatesFile: File | null
  budgetApprovalsFile: File | null
  tenderRfpFile: File | null

  // Documentation (File IDs from API - numbers as per backend)
  dprFileId: number | null
  feasibilityStudyFileId: number | null
  complianceCertificatesFileId: number | null
  budgetApprovalsFileId: number | null
  tenderRfpFileId: number | null

  // Media (File objects for new uploads)
  projectImage: File | null
  optionalMedia: File[] // Array for multiple files

  // Media (File IDs from API - numbers as per backend)
  projectImageId: number | null
  optionalMediaIds: number[]

  // Draft ID for file uploads
  draftId: number | null
}

export default function CreateProject() {
  const navigate = useNavigate()
  const location = useLocation()
  const { draftId, projectId } = useParams<{ draftId?: string; projectId?: string }>()
  const queryClient = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('identification')
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)
  const [isRejectedProject, setIsRejectedProject] = useState(false)
  const [isProjectLoaded, setIsProjectLoaded] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [fundingTypeOpen, setFundingTypeOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [ownershipOpen, setOwnershipOpen] = useState(false)
  const [municipalityOpen, setMunicipalityOpen] = useState(false)
  const { user } = useAuth()

  // Track which file is currently being deleted to prevent double calls
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null)

  // State for existing file metadata (for display and download)
  interface FileMetadata {
    id: number
    name: string
    size: number
    type: string
    documentType: string
  }
  const [existingFilesMetadata, setExistingFilesMetadata] = useState<Record<string, FileMetadata | null>>({
    dprFile: null,
    feasibilityStudyFile: null,
    complianceCertificatesFile: null,
    budgetApprovalsFile: null,
    tenderRfpFile: null,
    projectImage: null,
  })
  const [existingOptionalMediaMetadata, setExistingOptionalMediaMetadata] = useState<FileMetadata[]>([])
  // Check if we're editing a rejected project
  useEffect(() => {
    const isRejected = location.pathname.includes('/rejected/')
    setIsRejectedProject(isRejected)
  }, [location.pathname])

  // Query for project categories
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['project-categories'],
    queryFn: () => apiService.get('/master/project-categories'),
  })

  // Query for project stages (assuming similar endpoint exists)
  const { data: stagesResponse, isLoading: isLoadingStages } = useQuery({
    queryKey: ['project-stages'],
    queryFn: () => apiService.get('/master/project-stages'),
    retry: false, // Don't retry if endpoint doesn't exist
  })

  // Query for funding types
  const { data: fundingTypesResponse, isLoading: isLoadingFundingTypes } = useQuery({
    queryKey: ['funding-types'],
    queryFn: () => apiService.get('/master/funding-types'),
    retry: false,
  })

  // Query for modes of implementation
  const { data: modesResponse, isLoading: isLoadingModes } = useQuery({
    queryKey: ['modes-of-implementation'],
    queryFn: () => apiService.get('/master/mode-of-implementations'),
    retry: false,
  })

  // Query for ownership types
  const { data: ownershipResponse, isLoading: isLoadingOwnership } = useQuery({
    queryKey: ['ownership-types'],
    queryFn: () => apiService.get('/master/ownerships'),
    retry: false,
  })

  // Query for municipalities using Perdix API with parent_branch_id: 101
  const { data: municipalitiesResponse, isLoading: isLoadingMunicipalities } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const response = await apiService.post('/perdix/query', {
        identifier: 'childBranch.list',
        limit: 0,
        offset: 0,
        parameters: {
          parent_branch_id: 101
        },
        skip_relogin: 'yes'
      })
      // Extract results array and map to Municipality format
      const results = (response as any)?.results || []
      return results.map((item: any) => ({
        id: String(item.id),
        name: item.branch_name || item.branchName || '',
        code: String(item.id)
      }))
    },
    retry: false,
  })

  // Extract municipalities from API response
  const municipalities: any[] = useMemo(() => {
    if (!municipalitiesResponse) return []
    if (Array.isArray(municipalitiesResponse)) {
      return municipalitiesResponse
    }
    return []
  }, [municipalitiesResponse])

  // Extract categories and stages from API response
  const categories: ProjectCategory[] = useMemo(() => {
    if (!categoriesResponse) return []
    // Handle different response structures
    if ('data' in categoriesResponse && Array.isArray(categoriesResponse.data)) {
      return categoriesResponse.data
    }
    if (Array.isArray(categoriesResponse)) {
      return categoriesResponse
    }
    return []
  }, [categoriesResponse])

  const stages: ProjectStage[] = useMemo(() => {
    if (!stagesResponse) return []
    // Handle different response structures
    if ('data' in stagesResponse && Array.isArray(stagesResponse.data)) {
      return stagesResponse.data
    }
    if (Array.isArray(stagesResponse)) {
      return stagesResponse
    }
    return []
  }, [stagesResponse])

  const fundingTypes: FundingType[] = useMemo(() => {
    if (!fundingTypesResponse) return []
    if ('data' in fundingTypesResponse && Array.isArray(fundingTypesResponse.data)) {
      return fundingTypesResponse.data
    }
    if (Array.isArray(fundingTypesResponse)) {
      return fundingTypesResponse
    }
    return []
  }, [fundingTypesResponse])

  const modesOfImplementation: ModeOfImplementation[] = useMemo(() => {
    if (!modesResponse) return []
    if ('data' in modesResponse && Array.isArray(modesResponse.data)) {
      return modesResponse.data
    }
    if (Array.isArray(modesResponse)) {
      return modesResponse
    }
    return []
  }, [modesResponse])

  const ownershipTypes: Ownership[] = useMemo(() => {
    if (!ownershipResponse) return []
    if ('data' in ownershipResponse && Array.isArray(ownershipResponse.data)) {
      return ownershipResponse.data
    }
    if (Array.isArray(ownershipResponse)) {
      return ownershipResponse
    }
    return []
  }, [ownershipResponse])

  // Reset draft loaded flag when draftId changes
  useEffect(() => {
    if (draftId) {
      setIsDraftLoaded(false)
      setCurrentDraftId(draftId)
    } else {
      setIsDraftLoaded(false)
      setCurrentDraftId(null)
    }
  }, [draftId])

  const [formData, setFormData] = useState<FormData>({
    projectTitle: '',
    projectReferenceId: '', // Will be set by backend when draft is created or file is uploaded
    municipalityId: '',
    department: '',
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    category: '',
    stage: '',
    description: '',
    startDate: '',
    endDate: '',
    fundingType: '',
    commitmentAllocationDays: '7', // Default 7 days
    minimumCommitmentFulfilmentPercentage: '',
    modeOfImplementation: '',
    ownership: '',
    totalProjectCost: '',
    fundingRequirement: '',
    alreadySecuredFunds: '0',
    fundraisingStartDate: '',
    fundraisingEndDate: '',
    municipalityCreditRating: '',
    municipalityCreditScore: '',
    tenure: '',
    cutOffRatePercentage: '',
    minimumCommitmentAmount: '',
    conditions: '',
    state: '',
    city: '',
    ward: '',
    dprFile: null,
    feasibilityStudyFile: null,
    complianceCertificatesFile: null,
    budgetApprovalsFile: null,
    tenderRfpFile: null,
    dprFileId: null,
    feasibilityStudyFileId: null,
    complianceCertificatesFileId: null,
    budgetApprovalsFileId: null,
    tenderRfpFileId: null,
    projectImage: null,
    optionalMedia: [],
    projectImageId: null,
    optionalMediaIds: [],
    draftId: null,
  })

  // Calculate commitment gap
  const commitmentGap = useMemo(() => {
    const requirement = parseFloat(formData.fundingRequirement || '0')
    const secured = parseFloat(formData.alreadySecuredFunds || '0')
    const gap = Math.max(requirement - secured, 0)
    return isFinite(gap) ? gap : 0
  }, [formData.fundingRequirement, formData.alreadySecuredFunds])

  // Helper function to map form data to draft API payload
  const mapFormDataToDraftPayload = (): any => {
    // Convert project stage to lowercase with underscores for API
    const projectStage = formData.stage ? formData.stage.toLowerCase().replace(/\s+/g, '_') : 'planning'

    // Format dates for API
    const startDate = formData.startDate || ''
    const endDate = formData.endDate || ''

    // Format fundraising dates from user input
    const fundraisingStartDate = formData.fundraisingStartDate ? `${formData.fundraisingStartDate}T00:00:00` : undefined
    const fundraisingEndDate = formData.fundraisingEndDate ? `${formData.fundraisingEndDate}T23:59:59` : undefined
    const createdBy = user?.data?.login
    return {
      title: formData.projectTitle || '',
      organization_type: user?.data?.org_type,
      organization_id: formData.municipalityId || '',
      department: formData.department || '',
      contact_person: formData.contactPersonName || '',
      contact_person_designation: formData.contactPersonDesignation || undefined,
      contact_person_email: formData.contactPersonEmail || undefined,
      contact_person_phone: formData.contactPersonPhone || undefined,
      category: formData.category || '',
      project_stage: projectStage,
      description: formData.description || '',
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      total_project_cost: formData.totalProjectCost ? parseFloat(formData.totalProjectCost) : undefined,
      funding_requirement: formData.fundingRequirement ? parseFloat(formData.fundingRequirement) : undefined,
      already_secured_funds: formData.alreadySecuredFunds ? parseFloat(formData.alreadySecuredFunds) : undefined,
      commitment_gap: commitmentGap > 0 ? commitmentGap : undefined,
      currency: 'INR',
      fundraising_start_date: fundraisingStartDate,
      fundraising_end_date: fundraisingEndDate,
      municipality_credit_rating: formData.municipalityCreditRating || undefined,
      municipality_credit_score: formData.municipalityCreditScore ? parseFloat(formData.municipalityCreditScore) : undefined,
      // New Overview fields
      funding_type: formData.fundingType || undefined,
      commitment_allocation_days: formData.commitmentAllocationDays ? parseInt(formData.commitmentAllocationDays, 10) : undefined,
      minimum_commitment_fulfilment_percentage: formData.minimumCommitmentFulfilmentPercentage ? parseFloat(formData.minimumCommitmentFulfilmentPercentage) : undefined,
      mode_of_implementation: formData.modeOfImplementation || undefined,
      ownership: formData.ownership || undefined,
      // New Financial fields
      tenure: formData.tenure ? parseInt(formData.tenure, 10) : undefined,
      cut_off_rate_percentage: formData.cutOffRatePercentage ? parseFloat(formData.cutOffRatePercentage) : undefined,
      minimum_commitment_amount: formData.minimumCommitmentAmount ? parseFloat(formData.minimumCommitmentAmount) : undefined,
      conditions: formData.conditions || undefined,
      // Location fields
      state: formData.state || undefined,
      city: formData.city || undefined,
      ward: formData.ward || undefined,
      // File IDs
      dpr_file_id: formData.dprFileId || undefined,
      feasibility_study_file_id: formData.feasibilityStudyFileId || undefined,
      compliance_certificates_file_id: formData.complianceCertificatesFileId || undefined,
      budget_approvals_file_id: formData.budgetApprovalsFileId || undefined,
      tender_rfp_file_id: formData.tenderRfpFileId || undefined,
      project_image_id: formData.projectImageId || undefined,
      optional_media_ids: formData.optionalMediaIds.length > 0 ? formData.optionalMediaIds : undefined,
      created_by: createdBy,
    }
  }

  // Helper function to map form data to API payload
  const mapFormDataToApiPayload = (status: 'draft' | 'pending_validation'): any => {
    // Convert project stage to lowercase with underscores for API
    const projectStage = formData.stage ? formData.stage.toLowerCase().replace(/\s+/g, '_') : 'planning'

    // Format dates for API
    const startDate = formData.startDate || ''
    const endDate = formData.endDate || ''

    // Format fundraising dates from user input
    const fundraisingStartDate = formData.fundraisingStartDate ? `${formData.fundraisingStartDate}T00:00:00Z` : undefined
    const fundraisingEndDate = formData.fundraisingEndDate ? `${formData.fundraisingEndDate}T23:59:59Z` : undefined

    // Get current user email (fallback to contact person email for MVP)
    const createdBy = user?.data?.login

    return {
      organization_type: user?.data?.org_type,
      organization_id: formData.municipalityId,
      title: formData.projectTitle,
      department: formData.department || '',
      contact_person: formData.contactPersonName,
      category: formData.category,
      project_stage: projectStage,
      description: formData.description,
      start_date: startDate,
      end_date: endDate,
      state: formData.state || '',
      city: formData.city || '',
      ward: formData.ward || '',
      contact_person_email: formData.contactPersonEmail || '',
      contact_person_phone: formData.contactPersonPhone || '',
      contact_person_designation: formData.contactPersonDesignation || '',
      total_project_cost: formData.totalProjectCost || '0.00',
      funding_requirement: formData.fundingRequirement || '0.00',
      already_secured_funds: formData.alreadySecuredFunds || '0.00',
      commitment_gap: commitmentGap > 0 ? commitmentGap : undefined,
      fundraising_start_date: fundraisingStartDate,
      fundraising_end_date: fundraisingEndDate,
      municipality_credit_rating: formData.municipalityCreditRating || '',
      municipality_credit_score: formData.municipalityCreditScore || '',
      // New Overview fields
      funding_type: formData.fundingType || '',
      commitment_allocation_days: formData.commitmentAllocationDays ? parseInt(formData.commitmentAllocationDays, 10) : 7,
      minimum_commitment_fulfilment_percentage: formData.minimumCommitmentFulfilmentPercentage ? parseFloat(formData.minimumCommitmentFulfilmentPercentage) : undefined,
      mode_of_implementation: formData.modeOfImplementation || '',
      ownership: formData.ownership || '',
      // New Financial fields
      tenure: formData.tenure ? parseInt(formData.tenure, 10) : undefined,
      cut_off_rate_percentage: formData.cutOffRatePercentage ? parseFloat(formData.cutOffRatePercentage) : undefined,
      minimum_commitment_amount: formData.minimumCommitmentAmount ? parseFloat(formData.minimumCommitmentAmount) : undefined,
      conditions: formData.conditions || '',
      status: status,
      visibility: 'public', // Default to private for MVP
      approved_by: null, // Will be set by backend on approval
      admin_notes: '', // Empty for new projects
      // File IDs
      dpr_file_id: formData.dprFileId || undefined,
      feasibility_study_file_id: formData.feasibilityStudyFileId || undefined,
      compliance_certificates_file_id: formData.complianceCertificatesFileId || undefined,
      budget_approvals_file_id: formData.budgetApprovalsFileId || undefined,
      tender_rfp_file_id: formData.tenderRfpFileId || undefined,
      project_image_id: formData.projectImageId || undefined,
      optional_media_ids: formData.optionalMediaIds.length > 0 ? formData.optionalMediaIds : undefined,
      created_by: createdBy,
    }
  }

  // Query to load draft data if draftId exists
  const { data: draftData, isLoading: isLoadingDraft, isError: isDraftError } = useQuery({
    queryKey: ['project-draft', draftId],
    queryFn: async () => {
      const response = await apiService.get(`/project-drafts/${draftId}`)
      // Handle different response structures
      return response?.data || response
    },
    enabled: !!draftId && !isRejectedProject,
  })

  // Query to load rejected project data if projectId exists
  const { data: projectData, isLoading: isLoadingProject, isError: isProjectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await apiService.get(`/projects/${projectId}`)
      // Handle different response structures
      return response?.data || response
    },
    enabled: !!projectId && isRejectedProject,
  })

  // Helper function to load project/draft data into form
  const loadProjectDataIntoForm = (data: any, isProject: boolean = false) => {
    const item = (data as any)?.data || data

    if (item && item.id) {
      setFormData(prev => {
        // Map stage value from API format to display format
        let mappedStage = prev.stage
        if (item.project_stage) {
          // Try to find matching stage from API stages array (if loaded)
          const apiStage = stages.length > 0 ? stages.find(st =>
            st.value.toLowerCase().replace(/\s+/g, '_') === item.project_stage?.toLowerCase() ||
            st.value === item.project_stage
          ) : null
          // If found, use the API value format; otherwise format the value
          mappedStage = apiStage?.value || item.project_stage.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        }

        return {
          ...prev,
          projectTitle: item.title ?? prev.projectTitle,
          projectReferenceId: item.project_reference_id ?? prev.projectReferenceId,
          municipalityId: item.organization_id ?? prev.municipalityId,
          department: item.department ?? prev.department,
          contactPersonName: item.contact_person ?? prev.contactPersonName,
          contactPersonDesignation: item.contact_person_designation ?? prev.contactPersonDesignation,
          contactPersonEmail: item.contact_person_email ?? prev.contactPersonEmail,
          contactPersonPhone: item.contact_person_phone ?? prev.contactPersonPhone,
          category: item.category ?? prev.category,
          stage: mappedStage,
          description: item.description ?? prev.description,
          startDate: item.start_date ? item.start_date.split('T')[0] : prev.startDate,
          endDate: item.end_date ? item.end_date.split('T')[0] : prev.endDate,
          totalProjectCost: item.total_project_cost != null ? String(item.total_project_cost) : prev.totalProjectCost,
          fundingRequirement: item.funding_requirement != null ? String(item.funding_requirement) : prev.fundingRequirement,
          alreadySecuredFunds: item.already_secured_funds != null ? String(item.already_secured_funds) : prev.alreadySecuredFunds,
          fundraisingStartDate: item.fundraising_start_date ? item.fundraising_start_date.split('T')[0] : prev.fundraisingStartDate,
          fundraisingEndDate: item.fundraising_end_date ? item.fundraising_end_date.split('T')[0] : prev.fundraisingEndDate,
          municipalityCreditRating: item.municipality_credit_rating ?? prev.municipalityCreditRating,
          municipalityCreditScore: item.municipality_credit_score != null ? String(item.municipality_credit_score) : prev.municipalityCreditScore,
          // New Overview fields
          fundingType: item.funding_type ?? prev.fundingType,
          commitmentAllocationDays: item.commitment_allocation_days != null ? String(item.commitment_allocation_days) : prev.commitmentAllocationDays,
          minimumCommitmentFulfilmentPercentage: item.minimum_commitment_fulfilment_percentage != null ? String(item.minimum_commitment_fulfilment_percentage) : prev.minimumCommitmentFulfilmentPercentage,
          modeOfImplementation: item.mode_of_implementation ?? prev.modeOfImplementation,
          ownership: item.ownership ?? prev.ownership,
          // New Financial fields
          tenure: item.tenure != null ? String(item.tenure) : prev.tenure,
          cutOffRatePercentage: item.cut_off_rate_percentage != null ? String(item.cut_off_rate_percentage) : prev.cutOffRatePercentage,
          minimumCommitmentAmount: item.minimum_commitment_amount != null ? String(item.minimum_commitment_amount) : prev.minimumCommitmentAmount,
          conditions: item.conditions ?? prev.conditions,
          // Location fields if available
          state: item.state ?? prev.state,
          city: item.city ?? prev.city,
          ward: item.ward ?? prev.ward,
          // Draft ID (project_reference_id already set above on line 512)
          draftId: !isProject ? (item.id ? parseInt(String(item.id), 10) : null) : prev.draftId,
          // File IDs - Parse from documents array if available, otherwise use direct fields
          dprFileId: item.dpr_file_id ?? prev.dprFileId,
          feasibilityStudyFileId: item.feasibility_study_file_id ?? prev.feasibilityStudyFileId,
          complianceCertificatesFileId: item.compliance_certificates_file_id ?? prev.complianceCertificatesFileId,
          budgetApprovalsFileId: item.budget_approvals_file_id ?? prev.budgetApprovalsFileId,
          tenderRfpFileId: item.tender_rfp_file_id ?? prev.tenderRfpFileId,
          projectImageId: item.project_image_id ?? prev.projectImageId,
          optionalMediaIds: item.optional_media_ids ?? prev.optionalMediaIds,
        }
      })

      // Parse documents array if available (new backend format)
      if (item.documents && Array.isArray(item.documents)) {
        const fileMetadataMap: Record<string, FileMetadata | null> = {
          dprFile: null,
          feasibilityStudyFile: null,
          complianceCertificatesFile: null,
          budgetApprovalsFile: null,
          tenderRfpFile: null,
          projectImage: null,
        }
        const optionalMediaMetadata: FileMetadata[] = []

        // Map document_type to form field names
        const documentTypeToField: Record<string, string> = {
          'dpr': 'dprFile',
          'feasibility_study': 'feasibilityStudyFile',
          'compliance_certificate': 'complianceCertificatesFile',
          'budget_approval': 'budgetApprovalsFile',
          'tender_rfp': 'tenderRfpFile',
          'project_image': 'projectImage',
        }

        item.documents.forEach((doc: any) => {
          const fieldName = documentTypeToField[doc.document_type]
          const file = doc.file

          if (file && file.id) {
            const metadata: FileMetadata = {
              id: file.id,
              name: file.original_filename || file.filename || 'Unknown file',
              size: file.file_size || 0,
              type: file.mime_type || 'application/octet-stream',
              documentType: doc.document_type,
            }

            if (fieldName) {
              // Single file field
              fileMetadataMap[fieldName] = metadata

              // Update formData with file ID
              const fieldIdKey = `${fieldName}Id` as keyof FormData
              setFormData(prev => ({
                ...prev,
                [fieldIdKey]: file.id,
              }))
            } else if (doc.document_type === 'optional_media') {
              // Optional media (multiple files)
              optionalMediaMetadata.push(metadata)

              // Update formData with file ID
              setFormData(prev => ({
                ...prev,
                optionalMediaIds: [...prev.optionalMediaIds, file.id],
              }))
            }
          }
        })

        // Update metadata state
        setExistingFilesMetadata(fileMetadataMap)
        setExistingOptionalMediaMetadata(optionalMediaMetadata)
      }

      if (!isProject) {
        setCurrentDraftId(String(item.id))
        setIsDraftLoaded(true)
      } else {
        setIsProjectLoaded(true)
      }
    }
  }

  // Load draft data into form when draft is loaded
  useEffect(() => {
    if (draftData && draftId && !isDraftLoaded && !isRejectedProject) {
      loadProjectDataIntoForm(draftData, false)
    }
  }, [draftData, draftId, isDraftLoaded, isRejectedProject, stages])

  // Load rejected project data into form when project is loaded
  useEffect(() => {
    if (projectData && projectId && !isProjectLoaded && isRejectedProject) {
      loadProjectDataIntoForm(projectData, true)
    }
  }, [projectData, projectId, isProjectLoaded, isRejectedProject, stages])

  // Mutation for saving draft
  const saveDraftMutation = useMutation({
    mutationFn: (payload: any) => {
      if (currentDraftId) {
        // Update existing draft
        return apiService.put(`/project-drafts/${currentDraftId}`, payload)
      } else {
        // Create new draft
        return apiService.post('/project-drafts/', payload)
      }
    },
    onSuccess: (data) => {
      // Handle different response structures - could be wrapped in 'data' property
      const response = (data as any)?.data || data
      const draftId = response?.id || currentDraftId

      // Extract project_reference_id from response (backend now includes it)
      const projectReferenceId = (data as any)?.project_reference_id || response?.project_reference_id || formData.projectReferenceId

      if (draftId && !currentDraftId) {
        setCurrentDraftId(String(draftId))
        // Update URL without navigation
        window.history.replaceState({}, '', `/main/admin/projects/create/${draftId}`)
      }

      // Store project_reference_id and draftId in form state
      setFormData(prev => ({
        ...prev,
        projectReferenceId: projectReferenceId || prev.projectReferenceId,
        draftId: draftId ? parseInt(String(draftId), 10) : prev.draftId,
      }))

      // Invalidate both the list query and the specific draft query
      queryClient.invalidateQueries({ queryKey: ['project-drafts'] })
      if (draftId) {
        queryClient.invalidateQueries({ queryKey: ['project-draft', String(draftId)] })
      }
      // Also invalidate the old draftId if it was different (shouldn't happen, but just in case)
      if (currentDraftId && currentDraftId !== String(draftId)) {
        queryClient.invalidateQueries({ queryKey: ['project-draft', currentDraftId] })
      }

      alerts.success('Draft Saved', 'Your project draft has been saved successfully.')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to save draft. Please try again.'
      alerts.error('Error', errorMessage)
    },
  })

  // Mutation for submitting draft (converts draft to project)
  const submitDraftMutation = useMutation({
    mutationFn: ({ draftId, payload }: { draftId: string; payload: any }) =>
      apiService.post(`/project-drafts/${draftId}/submit`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-drafts'] })
      alerts.success('Project Submitted', 'Your project has been submitted for validation. It will be reviewed by an admin.')
      navigate('/main/admin/projects/drafts')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to submit project. Please try again.'
      alerts.error('Error', errorMessage)
    },
  })

  // Mutation for creating project (only called on Submit for Validation when not a draft)
  const createProjectMutation = useMutation({
    mutationFn: (payload: any) => apiService.post('/projects/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      alerts.success('Project Submitted', 'Your project has been submitted for validation. It will be reviewed by an admin.')
      navigate('/main/admin/projects/drafts')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to submit project. Please try again.'
      alerts.error('Error', errorMessage)
    },
  })

  // Helper function to map form data to resubmit API payload
  const mapFormDataToResubmitPayload = (): any => {
    // Convert project stage to lowercase with underscores for API
    const projectStage = formData.stage ? formData.stage.toLowerCase().replace(/\s+/g, '_') : 'planning'

    // Format dates for API
    const startDate = formData.startDate || ''
    const endDate = formData.endDate || ''

    // Format fundraising dates from user input
    const fundraisingStartDate = formData.fundraisingStartDate ? `${formData.fundraisingStartDate}T00:00:00Z` : undefined
    const fundraisingEndDate = formData.fundraisingEndDate ? `${formData.fundraisingEndDate}T23:59:59Z` : undefined

    return {
      organization_type: user?.data?.org_type,
      organization_id: formData.municipalityId || '',
      title: formData.projectTitle,
      department: formData.department || '',
      contact_person: formData.contactPersonName,
      contact_person_designation: formData.contactPersonDesignation || undefined,
      contact_person_email: formData.contactPersonEmail || undefined,
      contact_person_phone: formData.contactPersonPhone || undefined,
      category: formData.category,
      project_stage: projectStage,
      description: formData.description,
      start_date: startDate,
      end_date: endDate,
      total_project_cost: formData.totalProjectCost || '0.00',
      funding_requirement: formData.fundingRequirement || '0.00',
      already_secured_funds: formData.alreadySecuredFunds || '0.00',
      commitment_gap: commitmentGap > 0 ? commitmentGap : undefined,
      fundraising_start_date: fundraisingStartDate,
      fundraising_end_date: fundraisingEndDate,
      municipality_credit_rating: formData.municipalityCreditRating || '',
      municipality_credit_score: formData.municipalityCreditScore || '',
      // New Overview fields
      funding_type: formData.fundingType || undefined,
      commitment_allocation_days: formData.commitmentAllocationDays ? parseInt(formData.commitmentAllocationDays, 10) : undefined,
      minimum_commitment_fulfilment_percentage: formData.minimumCommitmentFulfilmentPercentage ? parseFloat(formData.minimumCommitmentFulfilmentPercentage) : undefined,
      mode_of_implementation: formData.modeOfImplementation || undefined,
      ownership: formData.ownership || undefined,
      // New Financial fields
      tenure: formData.tenure ? parseInt(formData.tenure, 10) : undefined,
      cut_off_rate_percentage: formData.cutOffRatePercentage ? parseFloat(formData.cutOffRatePercentage) : undefined,
      minimum_commitment_amount: formData.minimumCommitmentAmount ? parseFloat(formData.minimumCommitmentAmount) : undefined,
      conditions: formData.conditions || undefined,
      // Location fields
      state: formData.state || undefined,
      city: formData.city || undefined,
      ward: formData.ward || undefined,
      // File IDs
      dpr_file_id: formData.dprFileId || undefined,
      feasibility_study_file_id: formData.feasibilityStudyFileId || undefined,
      compliance_certificates_file_id: formData.complianceCertificatesFileId || undefined,
      budget_approvals_file_id: formData.budgetApprovalsFileId || undefined,
      tender_rfp_file_id: formData.tenderRfpFileId || undefined,
      project_image_id: formData.projectImageId || undefined,
      optional_media_ids: formData.optionalMediaIds.length > 0 ? formData.optionalMediaIds : undefined,
    }
  }

  // Mutation for resubmitting rejected project
  const resubmitProjectMutation = useMutation({
    mutationFn: (payload: any) => {
      if (!projectId) throw new Error('Project ID is required for resubmission')
      return apiService.post(`/projects/${projectId}/resubmit`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      alerts.success('Project Resubmitted', 'Your project has been resubmitted for validation. It will be reviewed by an admin.')
      navigate('/main/admin/projects/drafts')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to resubmit project. Please try again.'
      alerts.error('Error', errorMessage)
    },
  })

  // Map field names to backend document_type values
  const getDocumentType = (field: string): string => {
    const documentTypeMap: Record<string, string> = {
      'dprFile': 'dpr',
      'feasibilityStudyFile': 'feasibility_study',
      'complianceCertificatesFile': 'compliance_certificate',
      'budgetApprovalsFile': 'budget_approval',
      'tenderRfpFile': 'tender_rfp',
      'projectImage': 'project_image',
      'optionalMedia': 'optional_media',
    }
    return documentTypeMap[field] || field
  }

  // Mutation for uploading a single file
  const uploadFileMutation = useMutation({
    mutationFn: async ({
      file,
      documentType,
      organizationId,
      projectReferenceId,
      draftId
    }: {
      file: File
      documentType: string
      organizationId: string
      projectReferenceId?: string | null
      draftId?: number | null
    }) => {
      const formDataObj = new FormData()
      formDataObj.append('file', file)
      formDataObj.append('document_type', documentType)
      formDataObj.append('organization_id', organizationId)
      formDataObj.append('access_level', 'public')
      formDataObj.append('auto_create_draft', 'true')

      // Add project_reference_id or draft_id if available
      if (projectReferenceId) {
        formDataObj.append('project_reference_id', projectReferenceId)
      } else if (draftId) {
        formDataObj.append('draft_id', draftId.toString())
      }

      // apiService.post() handles FormData automatically
      const response = await apiService.post('/projects/files/upload', formDataObj)

      // Backend response structure: { status: "success", data: { file_id: number, project_reference_id: string } }
      return {
        fileId: response?.data?.file_id || response?.data?.data?.file_id,
        projectReferenceId: response?.data?.project_reference_id || response?.data?.data?.project_reference_id || response?.project_reference_id,
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to upload file. Please try again.'
      alerts.error('Error', errorMessage)
    },
  })

  // Mutation for deleting a single file
  const deleteFileMutation = useMutation({
    mutationFn: async ({ fileId }: { fileId: number }) => {
      // Delete endpoint: DELETE /projects/files/{file_id}
      return apiService.delete(`/projects/files/${fileId}`)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to delete file. Please try again.'
      alerts.error('Error', errorMessage)
    },
  })

  // Mutation for uploading multiple files (for optional media)
  const uploadMultipleFilesMutation = useMutation({
    mutationFn: async ({
      files,
      documentType,
      organizationId,
      projectReferenceId,
      draftId
    }: {
      files: File[]
      documentType: string
      organizationId: string
      projectReferenceId?: string | null
      draftId?: number | null
    }) => {
      const uploadPromises = files.map(async (file) => {
        const formDataObj = new FormData()
        formDataObj.append('file', file)
        formDataObj.append('document_type', documentType)
        formDataObj.append('organization_id', organizationId)
        formDataObj.append('access_level', 'public')
        formDataObj.append('auto_create_draft', 'true')

        if (projectReferenceId) {
          formDataObj.append('project_reference_id', projectReferenceId)
        } else if (draftId) {
          formDataObj.append('draft_id', draftId.toString())
        }

        const response = await apiService.post('/projects/files/upload', formDataObj)
        return {
          fileId: response?.data?.file_id || response?.data?.data?.file_id,
          projectReferenceId: response?.data?.project_reference_id || response?.data?.data?.project_reference_id || response?.project_reference_id,
        }
      })
      return Promise.all(uploadPromises)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to upload files. Please try again.'
      alerts.error('Error', errorMessage)
    },
  })

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleMunicipalityChange = (municipalityId: string) => {
    setFormData(prev => ({
      ...prev,
      municipalityId: municipalityId,
    }))
    if (errors.municipalityId) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.municipalityId
        return newErrors
      })
    }
  }

  // File handling functions with upload support
  const handleFileChange = async (
    field: 'projectImage' | 'dprFile' | 'feasibilityStudyFile' | 'complianceCertificatesFile' | 'budgetApprovalsFile' | 'tenderRfpFile',
    file: File | null
  ) => {
    const fieldIdKey = `${field}Id` as keyof FormData
    const existingFileId = formData[fieldIdKey] as number | null

    // Get organization ID (municipalityId)
    const organizationId = formData.municipalityId
    if (!organizationId && file) {
      alerts.error('Error', 'Please select a municipality before uploading files.')
      return
    }

    // If replacing existing file, delete old one first
    if (file && existingFileId) {
      // Prevent double delete calls
      if (deletingFileId === existingFileId) {
        console.log('Delete already in progress for file:', existingFileId)
        return
      }

      try {
        // Mark this file as being deleted
        setDeletingFileId(existingFileId)

        // Call delete API
        await deleteFileMutation.mutateAsync({
          fileId: existingFileId
        })

        // Clear state after successful delete
        setFormData(prev => ({ ...prev, [fieldIdKey]: null }))
        setExistingFilesMetadata(prev => ({ ...prev, [field]: null }))
      } catch (error) {
        // Continue with upload even if delete fails
        console.error('Failed to delete old file:', error)
      } finally {
        // Clear deleting flag
        setDeletingFileId(null)
      }
    }

    // Update UI immediately (existing behavior)
    setFormData(prev => ({ ...prev, [field]: file }))

    // Clear error (existing behavior)
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Upload file if provided
    if (file) {
      try {
        const documentType = getDocumentType(field)
        const result = await uploadFileMutation.mutateAsync({
          file,
          documentType,
          organizationId,
          projectReferenceId: formData.projectReferenceId,
          draftId: currentDraftId ? parseInt(currentDraftId, 10) : null
        })

        // Store file ID and project_reference_id, clear File object after successful upload
        setFormData(prev => ({
          ...prev,
          [fieldIdKey]: result.fileId,
          [field]: null, // Clear File object after successful upload
          projectReferenceId: result.projectReferenceId || prev.projectReferenceId,
          draftId: result.projectReferenceId ? prev.draftId : prev.draftId, // Keep draftId if project_reference_id was returned
        }))

        // Update metadata with new file info
        if (result.fileId) {
          setExistingFilesMetadata(prev => ({
            ...prev,
            [field]: {
              id: result.fileId!,
              name: file.name,
              size: file.size,
              type: file.type,
              documentType: documentType,
            }
          }))
        }

        // Update currentDraftId if project_reference_id was returned (draft was auto-created)
        if (result.projectReferenceId && !currentDraftId) {
          // Draft was auto-created, but we don't have draftId yet
          // It will be set when user saves draft
        }

        alerts.success('Success', 'File uploaded successfully')
      } catch (error) {
        // Remove file on upload failure
        setFormData(prev => ({ ...prev, [field]: null }))
      }
    } else {
      // File removed - delete from server if uploaded
      if (existingFileId) {
        // Prevent double delete calls
        if (deletingFileId === existingFileId) {
          console.log('Delete already in progress for file:', existingFileId)
          return
        }

        try {
          // Mark this file as being deleted
          setDeletingFileId(existingFileId)

          // Clear state immediately to prevent UI issues
          setFormData(prev => ({ ...prev, [fieldIdKey]: null }))
          setExistingFilesMetadata(prev => ({ ...prev, [field]: null }))

          // Call delete API
          await deleteFileMutation.mutateAsync({
            fileId: existingFileId
          })

          alerts.success('Success', 'File removed successfully')
        } catch (error) {
          // Restore state if delete fails
          setFormData(prev => ({ ...prev, [fieldIdKey]: existingFileId }))
          console.error('Failed to delete file:', error)
          alerts.warn('Warning', 'File removed from form but could not be deleted from server.')
        } finally {
          // Clear deleting flag
          setDeletingFileId(null)
        }
      } else {
        // Clear file ID and metadata even if no fileId (for newly selected files that weren't uploaded yet)
        setFormData(prev => ({ ...prev, [fieldIdKey]: null }))
        setExistingFilesMetadata(prev => ({ ...prev, [field]: null }))
      }
    }
  }

  const handleMultipleFilesChange = async (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)

    // Get organization ID (municipalityId)
    const organizationId = formData.municipalityId
    if (!organizationId) {
      alerts.error('Error', 'Please select a municipality before uploading files.')
      return
    }

    // Update UI immediately
    setFormData(prev => ({
      ...prev,
      optionalMedia: [...prev.optionalMedia, ...newFiles]
    }))

    if (errors.optionalMedia) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.optionalMedia
        return newErrors
      })
    }

    // Upload files
    try {
      const results = await uploadMultipleFilesMutation.mutateAsync({
        files: newFiles,
        documentType: 'optional_media',
        organizationId,
        projectReferenceId: formData.projectReferenceId,
        draftId: currentDraftId ? parseInt(currentDraftId, 10) : null
      })

      // Extract file IDs and project_reference_id
      const fileIds = results.map(r => r.fileId).filter(Boolean) as number[]
      const projectReferenceId = results[0]?.projectReferenceId || formData.projectReferenceId

      // Create metadata for newly uploaded files
      const newFileMetadata: FileMetadata[] = newFiles.map((file, idx) => ({
        id: fileIds[idx],
        name: file.name,
        size: file.size,
        type: file.type,
        documentType: 'optional_media',
      }))

      // Store file IDs and project_reference_id, clear File objects, and add metadata
      setFormData(prev => ({
        ...prev,
        optionalMediaIds: [...prev.optionalMediaIds, ...fileIds],
        optionalMedia: prev.optionalMedia.filter((_, i) => i < prev.optionalMedia.length - newFiles.length),
        projectReferenceId: projectReferenceId || prev.projectReferenceId,
      }))

      // Add metadata for newly uploaded files
      setExistingOptionalMediaMetadata(prev => [...prev, ...newFileMetadata])

      alerts.success('Success', `${newFiles.length} file(s) uploaded successfully`)
    } catch (error) {
      // Remove files on upload failure
      setFormData(prev => ({
        ...prev,
        optionalMedia: prev.optionalMedia.filter((_, i) => i < prev.optionalMedia.length - newFiles.length)
      }))
    }
  }

  const removeOptionalMedia = async (index: number) => {
    // Get fileId from metadata array (for existing files) or from formData (for newly uploaded)
    const fileMetadata = existingOptionalMediaMetadata[index]
    const fileId = fileMetadata?.id || formData.optionalMediaIds[index]

    // Remove from UI immediately
    setFormData(prev => ({
      ...prev,
      optionalMedia: prev.optionalMedia.filter((_, i) => i !== index),
      optionalMediaIds: prev.optionalMediaIds.filter((_, i) => i !== index)
    }))

    // Remove from metadata if it exists
    if (fileMetadata) {
      setExistingOptionalMediaMetadata(prev => prev.filter((_, i) => i !== index))
    }

    // Delete from server if uploaded
    if (fileId) {
      try {
        await deleteFileMutation.mutateAsync({
          fileId
        })
        alerts.success('Success', 'File removed successfully')
      } catch (error) {
        console.error('Failed to delete file:', error)
        alerts.warn('Warning', 'File removed from form but could not be deleted from server.')
      }
    }
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

  // Helper function to get file type icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon
    if (file.type.startsWith('video/')) return Video
    return File
  }

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup project image URL
      if (formData.projectImage && formData.projectImage.type.startsWith('image/')) {
        const url = URL.createObjectURL(formData.projectImage)
        URL.revokeObjectURL(url)
      }
      // Cleanup optional media URLs
      formData.optionalMedia.forEach(file => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file)
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [formData.projectImage, formData.optionalMedia])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Project Identification
    if (!formData.projectTitle.trim()) {
      newErrors.projectTitle = 'Project title is required'
    }
    if (!formData.municipalityId) {
      newErrors.municipalityId = 'Municipality is required'
    }
    if (!formData.contactPersonName.trim()) {
      newErrors.contactPersonName = 'Contact person name is required'
    }
    if (!formData.contactPersonDesignation.trim()) {
      newErrors.contactPersonDesignation = 'Contact person designation is required'
    }
    if (!formData.contactPersonEmail.trim()) {
      newErrors.contactPersonEmail = 'Contact person email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPersonEmail)) {
      newErrors.contactPersonEmail = 'Please enter a valid email address'
    }
    if (!formData.contactPersonPhone.trim()) {
      newErrors.contactPersonPhone = 'Contact person phone is required'
    } else if (!/^[0-9]{10}$/.test(formData.contactPersonPhone.replace(/\D/g, ''))) {
      newErrors.contactPersonPhone = 'Please enter a valid 10-digit phone number'
    }

    // Project Overview
    if (!formData.category) {
      newErrors.category = 'Project category is required'
    }
    if (!formData.stage) {
      newErrors.stage = 'Project stage is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required'
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }
    if (!formData.fundingType) {
      newErrors.fundingType = 'Funding type is required'
    }
    if (!formData.commitmentAllocationDays || parseInt(formData.commitmentAllocationDays) <= 0) {
      newErrors.commitmentAllocationDays = 'Commitment allocation days is required and must be greater than 0'
    }
    if (!formData.minimumCommitmentFulfilmentPercentage) {
      newErrors.minimumCommitmentFulfilmentPercentage = 'Minimum commitment fulfilment is required'
    } else {
      const fulfilment = parseFloat(formData.minimumCommitmentFulfilmentPercentage)
      if (isNaN(fulfilment) || fulfilment < 0 || fulfilment > 100) {
        newErrors.minimumCommitmentFulfilmentPercentage = 'Minimum commitment fulfilment must be between 0 and 100'
      }
    }
    if (!formData.modeOfImplementation) {
      newErrors.modeOfImplementation = 'Mode of implementation is required'
    }
    if (!formData.ownership) {
      newErrors.ownership = 'Ownership is required'
    }

    // Financial Information
    const totalCost = parseFloat(formData.totalProjectCost)
    if (isNaN(totalCost) || totalCost <= 0) {
      newErrors.totalProjectCost = 'Total project cost must be greater than 0'
    }
    const fundingReq = parseFloat(formData.fundingRequirement)
    if (isNaN(fundingReq) || fundingReq <= 0) {
      newErrors.fundingRequirement = 'Funding requirement must be greater than 0'
    }
    if (!isNaN(fundingReq) && !isNaN(totalCost) && fundingReq > totalCost) {
      newErrors.fundingRequirement = 'Funding requirement cannot exceed total project cost'
    }
    const secured = parseFloat(formData.alreadySecuredFunds || '0')
    if (!isNaN(secured) && !isNaN(fundingReq) && secured > fundingReq) {
      newErrors.alreadySecuredFunds = 'Secured funds cannot exceed funding requirement'
    }

    // Fundraising Dates
    if (!formData.fundraisingStartDate) {
      newErrors.fundraisingStartDate = 'Fundraising start date is required'
    }
    if (!formData.fundraisingEndDate) {
      newErrors.fundraisingEndDate = 'Fundraising end date is required'
    }
    if (formData.fundraisingStartDate && formData.fundraisingEndDate && new Date(formData.fundraisingStartDate) >= new Date(formData.fundraisingEndDate)) {
      newErrors.fundraisingEndDate = 'Fundraising end date must be after start date'
    }

    // Financial Information - New Fields
    if (!formData.tenure) {
      newErrors.tenure = 'Tenure is required'
    } else {
      const tenureValue = parseInt(formData.tenure, 10)
      if (isNaN(tenureValue) || tenureValue <= 0) {
        newErrors.tenure = 'Tenure must be a positive number'
      }
    }
    if (!formData.cutOffRatePercentage) {
      newErrors.cutOffRatePercentage = 'Cut-off rate is required'
    } else {
      const rate = parseFloat(formData.cutOffRatePercentage)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.cutOffRatePercentage = 'Cut-off rate must be between 0 and 100'
      }
    }
    if (!formData.minimumCommitmentAmount) {
      newErrors.minimumCommitmentAmount = 'Minimum commitment amount is required'
    } else {
      const amount = parseFloat(formData.minimumCommitmentAmount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.minimumCommitmentAmount = 'Minimum commitment amount must be greater than 0'
      }
    }
    if (!formData.conditions.trim()) {
      newErrors.conditions = 'Conditions are required'
    }

    // Location
    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!formData.ward.trim()) {
      newErrors.ward = 'Ward is required'
    }

    // Documentation - DPR File is required (marked with * in UI)
    if (!formData.dprFileId) {
      newErrors.dprFile = 'DPR file is required'
    }

    // Media - Project Image is required (marked with * in UI)
    if (!formData.projectImageId) {
      newErrors.projectImage = 'Project image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if a tab section is complete
  const isTabComplete = (tab: string): boolean => {
    switch (tab) {
      case 'identification':
        return !!(
          formData.projectTitle.trim() &&
          formData.municipalityId &&
          formData.contactPersonName.trim() &&
          formData.contactPersonDesignation.trim() &&
          formData.contactPersonEmail.trim() &&
          formData.contactPersonPhone.trim()
        )
      case 'overview':
        return !!(
          formData.category &&
          formData.stage &&
          formData.description.trim() &&
          formData.startDate &&
          formData.endDate &&
          formData.fundingType &&
          formData.commitmentAllocationDays &&
          formData.minimumCommitmentFulfilmentPercentage &&
          formData.modeOfImplementation &&
          formData.ownership
        )
      case 'financial':
        return !!(
          formData.totalProjectCost &&
          formData.fundingRequirement &&
          formData.fundraisingStartDate &&
          formData.fundraisingEndDate &&
          formData.tenure &&
          formData.cutOffRatePercentage &&
          formData.minimumCommitmentAmount &&
          formData.conditions.trim() &&
          formData.state.trim() &&
          formData.city.trim() &&
          formData.ward.trim()
        )
      case 'documentation':
        // DPR File is required (marked with * in UI)
        // Other documentation files are optional
        return !!formData.dprFileId
      case 'media':
        // Project Image is required (marked with * in UI)
        // Optional media files are optional
        return !!formData.projectImageId
      default:
        return false
    }
  }

  const handleSaveDraft = () => {
    // Don't allow saving drafts for rejected projects - they must be resubmitted
    if (isRejectedProject) {
      alerts.error('Invalid Action', 'Rejected projects cannot be saved as drafts. Please resubmit the project instead.')
      return
    }
    // Validate organization type
    const orgType = user?.data?.org_type
    if (!orgType || (orgType !== 'Municipality' && orgType !== 'Munify')) {
      alerts.error('Invalid Organization Type', 'Only Municipality or Admin organizations can create projects.')
      return
    }
    const payload = mapFormDataToDraftPayload()
    saveDraftMutation.mutate(payload)
  }

  // Tab navigation
  const tabs = ['identification', 'overview', 'financial', 'documentation', 'media']

  // Check if all tabs are complete
  const allTabsComplete = useMemo(() => {
    return tabs.every(tab => isTabComplete(tab))
  }, [formData])

  // Handle tab change - just switch tabs, no API call
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const currentTabIndex = tabs.indexOf(activeTab)
  const canGoNext = currentTabIndex < tabs.length - 1
  const canGoPrevious = currentTabIndex > 0

  const goToNextTab = () => {
    if (canGoNext) {
      handleTabChange(tabs[currentTabIndex + 1])
    }
  }

  const goToPreviousTab = () => {
    if (canGoPrevious) {
      handleTabChange(tabs[currentTabIndex - 1])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      alerts.error('Validation Error', 'Please fix all highlighted fields before submitting.')
      return
    }

    // Validate organization type
    const orgType = user?.data?.org_type
    if (!orgType || (orgType !== 'Municipality' && orgType !== 'Munify')) {
      alerts.error('Invalid Organization Type', 'Only Municipality or Admin organizations can create projects.')
      return
    }

    // If we're resubmitting a rejected project
    if (isRejectedProject && projectId) {
      const payload = mapFormDataToResubmitPayload()
      resubmitProjectMutation.mutate(payload)
    }
    // If we have a draft ID, submit the draft (which will create the project from draft data)
    // IMPORTANT: Send both draftId and current form payload to ensure backend receives latest form data
    // even if user made changes without saving draft again
    else if (currentDraftId) {
      const payload = mapFormDataToApiPayload('pending_validation')
      submitDraftMutation.mutate({ draftId: currentDraftId, payload })
    } else {
      // If no draft exists, create project directly using the project creation API
      const payload = mapFormDataToApiPayload('pending_validation')
      createProjectMutation.mutate(payload)
    }
  }

  // Show loading state while draft or project is being loaded
  if ((isLoadingDraft && draftId && !isRejectedProject) || (isLoadingProject && projectId && isRejectedProject)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {isRejectedProject ? 'Loading project...' : 'Loading draft...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state if draft or project failed to load
  if ((isDraftError && draftId && !isRejectedProject) || (isProjectError && projectId && isRejectedProject)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {isRejectedProject ? 'Failed to load project. Please try again.' : 'Failed to load draft. Please try again.'}
          </p>
          <Button onClick={() => navigate('/main/admin/projects/drafts')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/main/admin/projects/drafts')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />

          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isRejectedProject ? 'Edit & Resubmit Project' : 'Create New Project'}
            </h1>
            <p className="text-muted-foreground">
              {isRejectedProject
                ? 'Review admin feedback, make necessary changes, and resubmit your project for validation'
                : 'Fill in all required information to publish your project'}
            </p>
          </div>
        </div>

      </div>

      {/* Admin Notes Alert for Rejected Projects */}
      {isRejectedProject && projectData && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Feedback</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm font-medium mb-1">Please review the following feedback before resubmitting:</p>
            <p className="text-sm whitespace-pre-wrap">
              {((projectData as any)?.data?.admin_notes || (projectData as any)?.admin_notes || 'No feedback available')}
            </p>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="identification" className="flex items-center gap-2">
              {isTabComplete('identification') ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              Identification
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              {isTabComplete('overview') ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              {isTabComplete('financial') ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              Financial & Location
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-2">
              {isTabComplete('documentation') ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              Documentation
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              {isTabComplete('media') ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              Media
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Project Identification */}
          <TabsContent value="identification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Project Identification</span>
                </CardTitle>
                <CardDescription>
                  Basic project identification and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="projectTitle">Project Title *</Label>
                    <Input
                      id="projectTitle"
                      value={formData.projectTitle}
                      onChange={(e) => handleChange('projectTitle', e.target.value)}
                      placeholder="Enter project title"
                      className={errors.projectTitle ? 'border-red-500' : ''}
                    />
                    {errors.projectTitle && (
                      <p className="text-sm text-red-500">{errors.projectTitle}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="municipalityId">Municipality *</Label>
                    <Popover open={municipalityOpen} onOpenChange={setMunicipalityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={municipalityOpen}
                          className={cn(
                            "w-full justify-between",
                            errors.municipalityId && "border-red-500",
                            !formData.municipalityId && "text-muted-foreground"
                          )}
                          disabled={isLoadingMunicipalities}
                        >
                          {isLoadingMunicipalities ? (
                            <span className="flex items-center gap-2">
                              <Spinner size={16} />
                              Loading municipalities...
                            </span>
                          ) : formData.municipalityId ? (
                            municipalities.find((m) => m.id === formData.municipalityId)?.name || formData.municipalityId
                          ) : (
                            "Select municipality"
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search municipalities..." />
                          <CommandList>
                            <CommandEmpty>No municipality found.</CommandEmpty>
                            <CommandGroup>
                              {municipalities.map((municipality) => (
                                <CommandItem
                                  key={municipality.id}
                                  value={municipality.name}
                                  onSelect={() => {
                                    handleMunicipalityChange(municipality.id)
                                    setMunicipalityOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.municipalityId === municipality.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {municipality.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.municipalityId && (
                      <p className="text-sm text-red-500">{errors.municipalityId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department/Division</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      placeholder="e.g., Public Works Department"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-4 flex items-center">
                    <User className="h-4 w-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                    Contact Person Information *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPersonName">Name *</Label>
                      <Input
                        id="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={(e) => handleChange('contactPersonName', e.target.value)}
                        placeholder="Full name"
                        className={errors.contactPersonName ? 'border-red-500' : ''}
                      />
                      {errors.contactPersonName && (
                        <p className="text-sm text-red-500">{errors.contactPersonName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPersonDesignation">Designation *</Label>
                      <Input
                        id="contactPersonDesignation"
                        value={formData.contactPersonDesignation}
                        onChange={(e) => handleChange('contactPersonDesignation', e.target.value)}
                        placeholder="e.g., Project Manager"
                        className={errors.contactPersonDesignation ? 'border-red-500' : ''}
                      />
                      {errors.contactPersonDesignation && (
                        <p className="text-sm text-red-500">{errors.contactPersonDesignation}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPersonEmail">Email *</Label>
                      <Input
                        id="contactPersonEmail"
                        type="email"
                        value={formData.contactPersonEmail}
                        onChange={(e) => handleChange('contactPersonEmail', e.target.value)}
                        placeholder="email@example.com"
                        className={errors.contactPersonEmail ? 'border-red-500' : ''}
                      />
                      {errors.contactPersonEmail && (
                        <p className="text-sm text-red-500">{errors.contactPersonEmail}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPersonPhone">Phone *</Label>
                      <Input
                        id="contactPersonPhone"
                        type="tel"
                        value={formData.contactPersonPhone}
                        onChange={(e) => handleChange('contactPersonPhone', e.target.value)}
                        placeholder="10-digit phone number"
                        className={errors.contactPersonPhone ? 'border-red-500' : ''}
                      />
                      {errors.contactPersonPhone && (
                        <p className="text-sm text-red-500">{errors.contactPersonPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Tab Navigation */}
            <div className="flex justify-between pt-4">
              <div></div>
              <Button
                type="button"
                variant="outline"
                onClick={goToNextTab}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: Project Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Project Overview</span>
                </CardTitle>
                <CardDescription>
                  Project category, stage, description, and timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Project Category *</Label>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoryOpen}
                          className={cn(
                            "w-full justify-between",
                            errors.category && "border-red-500",
                            !formData.category && "text-muted-foreground"
                          )}
                          disabled={isLoadingCategories}
                        >
                          {isLoadingCategories ? (
                            <span className="flex items-center gap-2">
                              <Spinner size={16} />
                              Loading categories...
                            </span>
                          ) : formData.category ? (
                            categories.find((cat) => cat.value === formData.category)?.value || formData.category
                          ) : (
                            "Select category"
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search categories..." />
                          <CommandList>
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup>
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.value}
                                  onSelect={() => {
                                    handleChange('category', category.value)
                                    setCategoryOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.category === category.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {category.value}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.category && (
                      <p className="text-sm text-red-500">{errors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stage">Project Stage *</Label>
                    <Popover open={stageOpen} onOpenChange={setStageOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={stageOpen}
                          className={cn(
                            "w-full justify-between",
                            errors.stage && "border-red-500",
                            !formData.stage && "text-muted-foreground"
                          )}
                          disabled={isLoadingStages}
                        >
                          {isLoadingStages ? (
                            <span className="flex items-center gap-2">
                              <Spinner size={16} />
                              Loading stages...
                            </span>
                          ) : formData.stage ? (
                            stages.find((st) => st.value === formData.stage)?.value || formData.stage
                          ) : (
                            "Select stage"
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search stages..." />
                          <CommandList>
                            <CommandEmpty>No stage found.</CommandEmpty>
                            <CommandGroup>
                              {stages.map((stage) => (
                                <CommandItem
                                  key={stage.id}
                                  value={stage.value}
                                  onSelect={() => {
                                    handleChange('stage', stage.value)
                                    setStageOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.stage === stage.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {stage.value}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.stage && (
                      <p className="text-sm text-red-500">{errors.stage}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Provide a brief narrative about the project objectives, scope, and expected impact"
                    rows={5}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <DatePicker
                      value={formData.startDate ? new Date(formData.startDate) : undefined}
                      onChange={(d) => {
                        const yyyyMmDd = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""
                        handleChange('startDate', yyyyMmDd)
                      }}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate}</p>
                    )}
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="endDate">End Date *</Label>
                    <DatePicker
                      value={formData.endDate ? new Date(formData.endDate) : undefined}
                      onChange={(d) => {
                        const yyyyMmDd = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""
                        handleChange('endDate', yyyyMmDd)
                      }}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="fundingType">Funding Type *</Label>
                    <Popover open={fundingTypeOpen} onOpenChange={setFundingTypeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={fundingTypeOpen}
                          className={cn(
                            "w-full justify-between",
                            errors.fundingType && "border-red-500",
                            !formData.fundingType && "text-muted-foreground"
                          )}
                          disabled={isLoadingFundingTypes}
                        >
                          {isLoadingFundingTypes ? (
                            <span className="flex items-center gap-2">
                              <Spinner size={16} />
                              Loading funding types...
                            </span>
                          ) : formData.fundingType ? (
                            fundingTypes.find((ft) => ft.value === formData.fundingType)?.value || formData.fundingType
                          ) : (
                            "Select funding type"
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search funding types..." />
                          <CommandList>
                            <CommandEmpty>No funding type found.</CommandEmpty>
                            <CommandGroup>
                              {fundingTypes.map((fundingType) => (
                                <CommandItem
                                  key={fundingType.id}
                                  value={fundingType.value}
                                  onSelect={() => {
                                    handleChange('fundingType', fundingType.value)
                                    setFundingTypeOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.fundingType === fundingType.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {fundingType.value}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.fundingType && (
                      <p className="text-sm text-red-500">{errors.fundingType}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commitmentAllocationDays">Commitment Allocation Days *</Label>
                    <Input
                      id="commitmentAllocationDays"
                      type="number"
                      min="1"
                      value={formData.commitmentAllocationDays}
                      onChange={(e) => handleChange('commitmentAllocationDays', e.target.value)}
                      placeholder="7"
                      className={errors.commitmentAllocationDays ? 'border-red-500' : ''}
                    />
                    {errors.commitmentAllocationDays && (
                      <p className="text-sm text-red-500">{errors.commitmentAllocationDays}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Default: 7 days if not configured
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumCommitmentFulfilmentPercentage">Minimum Commitment Fulfilment (%) *</Label>
                    <Input
                      id="minimumCommitmentFulfilmentPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.minimumCommitmentFulfilmentPercentage}
                      onChange={(e) => handleChange('minimumCommitmentFulfilmentPercentage', e.target.value)}
                      placeholder="e.g., 50.00"
                      className={errors.minimumCommitmentFulfilmentPercentage ? 'border-red-500' : ''}
                    />
                    {errors.minimumCommitmentFulfilmentPercentage && (
                      <p className="text-sm text-red-500">{errors.minimumCommitmentFulfilmentPercentage}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modeOfImplementation">Mode of Implementation *</Label>
                    <Popover open={modeOpen} onOpenChange={setModeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={modeOpen}
                          className={cn(
                            "w-full justify-between",
                            errors.modeOfImplementation && "border-red-500",
                            !formData.modeOfImplementation && "text-muted-foreground"
                          )}
                          disabled={isLoadingModes}
                        >
                          {isLoadingModes ? (
                            <span className="flex items-center gap-2">
                              <Spinner size={16} />
                              Loading modes...
                            </span>
                          ) : formData.modeOfImplementation ? (
                            modesOfImplementation.find((m) => m.value === formData.modeOfImplementation)?.value || formData.modeOfImplementation
                          ) : (
                            "Select mode"
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search modes..." />
                          <CommandList>
                            <CommandEmpty>No mode found.</CommandEmpty>
                            <CommandGroup>
                              {modesOfImplementation.map((mode) => (
                                <CommandItem
                                  key={mode.id}
                                  value={mode.value}
                                  onSelect={() => {
                                    handleChange('modeOfImplementation', mode.value)
                                    setModeOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.modeOfImplementation === mode.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {mode.value}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.modeOfImplementation && (
                      <p className="text-sm text-red-500">{errors.modeOfImplementation}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ownership">Ownership *</Label>
                    <Popover open={ownershipOpen} onOpenChange={setOwnershipOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={ownershipOpen}
                          className={cn(
                            "w-full justify-between",
                            errors.ownership && "border-red-500",
                            !formData.ownership && "text-muted-foreground"
                          )}
                          disabled={isLoadingOwnership}
                        >
                          {isLoadingOwnership ? (
                            <span className="flex items-center gap-2">
                              <Spinner size={16} />
                              Loading ownership types...
                            </span>
                          ) : formData.ownership ? (
                            ownershipTypes.find((o) => o.value === formData.ownership)?.value || formData.ownership
                          ) : (
                            "Select ownership"
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search ownership types..." />
                          <CommandList>
                            <CommandEmpty>No ownership type found.</CommandEmpty>
                            <CommandGroup>
                              {ownershipTypes.map((ownership) => (
                                <CommandItem
                                  key={ownership.id}
                                  value={ownership.value}
                                  onSelect={() => {
                                    handleChange('ownership', ownership.value)
                                    setOwnershipOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.ownership === ownership.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {ownership.value}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.ownership && (
                      <p className="text-sm text-red-500">{errors.ownership}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Tab Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={goToNextTab}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Financial & Location */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Financial Information</span>
                </CardTitle>
                <CardDescription>
                  Project costs and funding requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalProjectCost">Total Project Cost (₹) *</Label>
                    <Input
                      id="totalProjectCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalProjectCost}
                      onChange={(e) => handleChange('totalProjectCost', e.target.value)}
                      placeholder="100000000"
                      className={errors.totalProjectCost ? 'border-red-500' : ''}
                    />
                    {errors.totalProjectCost && (
                      <p className="text-sm text-red-500">{errors.totalProjectCost}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fundingRequirement">Funding Requirement (₹) *</Label>
                    <Input
                      id="fundingRequirement"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.fundingRequirement}
                      onChange={(e) => handleChange('fundingRequirement', e.target.value)}
                      placeholder="50000000"
                      className={errors.fundingRequirement ? 'border-red-500' : ''}
                    />
                    {errors.fundingRequirement && (
                      <p className="text-sm text-red-500">{errors.fundingRequirement}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alreadySecuredFunds">Already Secured Funds (₹)</Label>
                    <Input
                      id="alreadySecuredFunds"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.alreadySecuredFunds}
                      onChange={(e) => handleChange('alreadySecuredFunds', e.target.value)}
                      placeholder="10000000"
                      className={errors.alreadySecuredFunds ? 'border-red-500' : ''}
                    />
                    {errors.alreadySecuredFunds && (
                      <p className="text-sm text-red-500">{errors.alreadySecuredFunds}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Commitment Gap (Auto-calculated)</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      ₹{commitmentGap.toLocaleString('en-IN')}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      = Funding Requirement - Already Secured Funds
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="fundraisingStartDate">Fundraising Start Date *</Label>
                    <DatePicker
                      value={formData.fundraisingStartDate ? new Date(formData.fundraisingStartDate) : undefined}
                      onChange={(d) => {
                        const yyyyMmDd = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""
                        handleChange('fundraisingStartDate', yyyyMmDd)
                      }}
                    />
                    {errors.fundraisingStartDate && (
                      <p className="text-sm text-red-500">{errors.fundraisingStartDate}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      When fundraising will begin
                    </p>
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="fundraisingEndDate">Fundraising End Date *</Label>
                    <DatePicker
                      value={formData.fundraisingEndDate ? new Date(formData.fundraisingEndDate) : undefined}
                      onChange={(d) => {
                        const yyyyMmDd = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""
                        handleChange('fundraisingEndDate', yyyyMmDd)
                      }}
                    />
                    {errors.fundraisingEndDate && (
                      <p className="text-sm text-red-500">{errors.fundraisingEndDate}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      When fundraising will end
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="municipalityCreditRating">Municipality Credit Rating</Label>
                    <Input
                      id="municipalityCreditRating"
                      value={formData.municipalityCreditRating}
                      onChange={(e) => handleChange('municipalityCreditRating', e.target.value)}
                      placeholder="e.g., AA, A, BBB"
                      className={errors.municipalityCreditRating ? 'border-red-500' : ''}
                    />
                    {errors.municipalityCreditRating && (
                      <p className="text-sm text-red-500">{errors.municipalityCreditRating}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Credit rating of the municipality (e.g., AA, A, BBB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="municipalityCreditScore">Municipality Credit Score</Label>
                    <Input
                      id="municipalityCreditScore"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.municipalityCreditScore}
                      onChange={(e) => handleChange('municipalityCreditScore', e.target.value)}
                      placeholder="e.g., 85.50"
                      className={errors.municipalityCreditScore ? 'border-red-500' : ''}
                    />
                    {errors.municipalityCreditScore && (
                      <p className="text-sm text-red-500">{errors.municipalityCreditScore}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Credit score of the municipality (0-100)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="tenure">Tenure (Loan Tenure / Repayment Period) *</Label>
                    <Input
                      id="tenure"
                      type="number"
                      min="1"
                      value={formData.tenure}
                      onChange={(e) => handleChange('tenure', e.target.value)}
                      placeholder="e.g., 60 (months)"
                      className={errors.tenure ? 'border-red-500' : ''}
                    />
                    {errors.tenure && (
                      <p className="text-sm text-red-500">{errors.tenure}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Loan tenure or repayment period in months
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cutOffRatePercentage">Cut-off Rate (Minimum Acceptable Interest Rate) *</Label>
                    <Input
                      id="cutOffRatePercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.cutOffRatePercentage}
                      onChange={(e) => handleChange('cutOffRatePercentage', e.target.value)}
                      placeholder="e.g., 5.50"
                      className={errors.cutOffRatePercentage ? 'border-red-500' : ''}
                    />
                    {errors.cutOffRatePercentage && (
                      <p className="text-sm text-red-500">{errors.cutOffRatePercentage}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Minimum acceptable interest rate (%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumCommitmentAmount">Minimum Commitment Amount (₹) *</Label>
                    <Input
                      id="minimumCommitmentAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minimumCommitmentAmount}
                      onChange={(e) => handleChange('minimumCommitmentAmount', e.target.value)}
                      placeholder="e.g., 1000000"
                      className={errors.minimumCommitmentAmount ? 'border-red-500' : ''}
                    />
                    {errors.minimumCommitmentAmount && (
                      <p className="text-sm text-red-500">{errors.minimumCommitmentAmount}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="conditions">Conditions (Mandatory Terms Set by Municipality) *</Label>
                    <Textarea
                      id="conditions"
                      value={formData.conditions}
                      onChange={(e) => handleChange('conditions', e.target.value)}
                      placeholder="Enter mandatory terms and conditions set by the municipality"
                      rows={4}
                      className={errors.conditions ? 'border-red-500' : ''}
                    />
                    {errors.conditions && (
                      <p className="text-sm text-red-500">{errors.conditions}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Mandatory terms and conditions set by the municipality
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span>Location Details</span>
                </CardTitle>
                <CardDescription>
                  Project location information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="e.g., Maharashtra"
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="e.g., Mumbai"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ward">Ward *</Label>
                    <Input
                      id="ward"
                      value={formData.ward}
                      onChange={(e) => handleChange('ward', e.target.value)}
                      placeholder="e.g., Ward 21"
                      className={errors.ward ? 'border-red-500' : ''}
                    />
                    {errors.ward && (
                      <p className="text-sm text-red-500">{errors.ward}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Tab Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={goToNextTab}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab 4: Documentation */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span>Documentation</span>
                </CardTitle>
                <CardDescription>
                  Upload required project documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dprFile">Detailed Project Report (DPR) *</Label>
                    {!formData.dprFileId && (
                      <Input
                        id="dprFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleFileChange('dprFile', file)
                        }}
                        className={errors.dprFile ? 'border-red-500' : ''}
                        disabled={uploadFileMutation.isPending || deleteFileMutation.isPending}
                      />
                    )}
                    {formData.dprFileId ? (
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {existingFilesMetadata.dprFile?.name || 'File uploaded successfully'}
                            </span>
                            {existingFilesMetadata.dprFile?.size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(existingFilesMetadata.dprFile.size)}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Ready to submit</Badge>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {existingFilesMetadata.dprFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(existingFilesMetadata.dprFile!.id, existingFilesMetadata.dprFile!.name)}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange('dprFile', null)}
                            disabled={deleteFileMutation.isPending}
                            title="Delete file"
                          >
                            {deleteFileMutation.isPending ? (
                              <Spinner size={16} />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : formData.dprFile ? (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm">{formData.dprFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(formData.dprFile.size)})
                          </span>
                          {uploadFileMutation.isPending && (
                            <Spinner size={16} className="ml-2" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileChange('dprFile', null)}
                          disabled={uploadFileMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    {errors.dprFile && (
                      <p className="text-sm text-red-500">{errors.dprFile}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload DPR document (PDF, DOC, DOCX)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feasibilityStudyFile">Feasibility Study Report</Label>
                    {!formData.feasibilityStudyFileId && (
                      <Input
                        id="feasibilityStudyFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleFileChange('feasibilityStudyFile', file)
                        }}
                        disabled={uploadFileMutation.isPending || deleteFileMutation.isPending}
                      />
                    )}
                    {formData.feasibilityStudyFileId ? (
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {existingFilesMetadata.feasibilityStudyFile?.name || 'File uploaded successfully'}
                            </span>
                            {existingFilesMetadata.feasibilityStudyFile?.size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(existingFilesMetadata.feasibilityStudyFile.size)}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Ready to submit</Badge>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {existingFilesMetadata.feasibilityStudyFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(existingFilesMetadata.feasibilityStudyFile!.id, existingFilesMetadata.feasibilityStudyFile!.name)}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange('feasibilityStudyFile', null)}
                            disabled={deleteFileMutation.isPending}
                            title="Remove file"
                          >
                            {deleteFileMutation.isPending ? (
                              <Spinner size={16} />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : formData.feasibilityStudyFile ? (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm">{formData.feasibilityStudyFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(formData.feasibilityStudyFile.size)})
                          </span>
                          {uploadFileMutation.isPending && (
                            <Spinner size={16} className="ml-2" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileChange('feasibilityStudyFile', null)}
                          disabled={uploadFileMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Upload feasibility study if available (PDF, DOC, DOCX)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complianceCertificatesFile">Compliance Certificates</Label>
                    {!formData.complianceCertificatesFileId && (
                      <Input
                        id="complianceCertificatesFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleFileChange('complianceCertificatesFile', file)
                        }}
                        disabled={uploadFileMutation.isPending || deleteFileMutation.isPending}
                      />
                    )}
                    {formData.complianceCertificatesFileId ? (
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {existingFilesMetadata.complianceCertificatesFile?.name || 'File uploaded successfully'}
                            </span>
                            {existingFilesMetadata.complianceCertificatesFile?.size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(existingFilesMetadata.complianceCertificatesFile.size)}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Ready to submit</Badge>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {existingFilesMetadata.complianceCertificatesFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(existingFilesMetadata.complianceCertificatesFile!.id, existingFilesMetadata.complianceCertificatesFile!.name)}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange('complianceCertificatesFile', null)}
                            disabled={deleteFileMutation.isPending}
                            title="Remove file"
                          >
                            {deleteFileMutation.isPending ? (
                              <Spinner size={16} />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : formData.complianceCertificatesFile ? (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm">{formData.complianceCertificatesFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(formData.complianceCertificatesFile.size)})
                          </span>
                          {uploadFileMutation.isPending && (
                            <Spinner size={16} className="ml-2" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileChange('complianceCertificatesFile', null)}
                          disabled={uploadFileMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Statutory clearances, environment, safety certificates (PDF, DOC, DOCX)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetApprovalsFile">Budget Approvals</Label>
                    {!formData.budgetApprovalsFileId && (
                      <Input
                        id="budgetApprovalsFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleFileChange('budgetApprovalsFile', file)
                        }}
                        disabled={uploadFileMutation.isPending || deleteFileMutation.isPending}
                      />
                    )}
                    {formData.budgetApprovalsFileId ? (
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {existingFilesMetadata.budgetApprovalsFile?.name || 'File uploaded successfully'}
                            </span>
                            {existingFilesMetadata.budgetApprovalsFile?.size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(existingFilesMetadata.budgetApprovalsFile.size)}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Ready to submit</Badge>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {existingFilesMetadata.budgetApprovalsFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(existingFilesMetadata.budgetApprovalsFile!.id, existingFilesMetadata.budgetApprovalsFile!.name)}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange('budgetApprovalsFile', null)}
                            disabled={deleteFileMutation.isPending}
                            title="Remove file"
                          >
                            {deleteFileMutation.isPending ? (
                              <Spinner size={16} />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : formData.budgetApprovalsFile ? (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm">{formData.budgetApprovalsFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(formData.budgetApprovalsFile.size)})
                          </span>
                          {uploadFileMutation.isPending && (
                            <Spinner size={16} className="ml-2" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileChange('budgetApprovalsFile', null)}
                          disabled={uploadFileMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Municipal council / state approvals (PDF, DOC, DOCX)
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tenderRfpFile">Tender / RFP Documents</Label>
                    {!formData.tenderRfpFileId && (
                      <Input
                        id="tenderRfpFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleFileChange('tenderRfpFile', file)
                        }}
                        disabled={uploadFileMutation.isPending || deleteFileMutation.isPending}
                      />
                    )}
                    {formData.tenderRfpFileId ? (
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {existingFilesMetadata.tenderRfpFile?.name || 'File uploaded successfully'}
                            </span>
                            {existingFilesMetadata.tenderRfpFile?.size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(existingFilesMetadata.tenderRfpFile.size)}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Ready to submit</Badge>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {existingFilesMetadata.tenderRfpFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(existingFilesMetadata.tenderRfpFile!.id, existingFilesMetadata.tenderRfpFile!.name)}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange('tenderRfpFile', null)}
                            disabled={deleteFileMutation.isPending}
                            title="Remove file"
                          >
                            {deleteFileMutation.isPending ? (
                              <Spinner size={16} />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : formData.tenderRfpFile ? (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm">{formData.tenderRfpFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(formData.tenderRfpFile.size)})
                          </span>
                          {uploadFileMutation.isPending && (
                            <Spinner size={16} className="ml-2" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileChange('tenderRfpFile', null)}
                          disabled={uploadFileMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Upload tender or RFP documents if applicable (PDF, DOC, DOCX)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Tab Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={goToNextTab}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab 5: Media & Transparency */}
          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  <span>Media & Transparency</span>
                </CardTitle>
                <CardDescription>
                  Project images and optional media files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectImage">Project Image *</Label>
                  {!formData.projectImageId && (
                    <Input
                      id="projectImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        handleFileChange('projectImage', file)
                      }}
                      className={errors.projectImage ? 'border-red-500' : ''}
                      disabled={uploadFileMutation.isPending || deleteFileMutation.isPending}
                    />
                  )}
                  {formData.projectImageId ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {existingFilesMetadata.projectImage?.name || 'Image uploaded successfully'}
                            </span>
                            {existingFilesMetadata.projectImage?.size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(existingFilesMetadata.projectImage.size)}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Ready to submit</Badge>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {existingFilesMetadata.projectImage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(existingFilesMetadata.projectImage!.id, existingFilesMetadata.projectImage!.name)}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange('projectImage', null)}
                            disabled={deleteFileMutation.isPending}
                            title="Remove file"
                          >
                            {deleteFileMutation.isPending ? (
                              <Spinner size={16} />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : formData.projectImage ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-sm">{formData.projectImage.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(formData.projectImage.size)})
                          </span>
                          {uploadFileMutation.isPending && (
                            <Spinner size={16} className="ml-2" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileChange('projectImage', null)}
                          disabled={uploadFileMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.projectImage.type.startsWith('image/') && (
                        <div className="mt-2">
                          <img
                            src={URL.createObjectURL(formData.projectImage)}
                            alt="Project preview"
                            className="max-w-full h-48 object-cover rounded-md border"
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                  {errors.projectImage && (
                    <p className="text-sm text-red-500">{errors.projectImage}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload a main project image (JPG, PNG, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="optionalMedia">Optional Media (Videos, Photos, Infographics)</Label>
                  <Input
                    id="optionalMedia"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      handleMultipleFilesChange(e.target.files)
                      // Reset input to allow selecting the same file again
                      e.target.value = ''
                    }}
                    disabled={uploadMultipleFilesMutation.isPending || deleteFileMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can upload multiple files (images and videos). Click "Choose File" again to add more.
                  </p>

                  {/* Uploaded Files List */}
                  {existingOptionalMediaMetadata.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="text-sm font-medium flex items-center space-x-2">
                        <span>Uploaded Files ({existingOptionalMediaMetadata.length})</span>
                        <Badge variant="secondary" className="text-xs">Ready to submit</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {existingOptionalMediaMetadata.map((fileMetadata, index) => {
                          // Determine icon based on file type
                          const FileIcon = fileMetadata.type.startsWith('image/')
                            ? ImageIcon
                            : fileMetadata.type.startsWith('video/')
                              ? Video
                              : File
                          const isImage = fileMetadata.type.startsWith('image/')

                          return (
                            <div
                              key={`uploaded-${fileMetadata.id}-${index}`}
                              className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20 border-green-200 space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1 min-w-0">
                                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{fileMetadata.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(fileMetadata.size)} • {fileMetadata.type.split('/')[1]?.toUpperCase() || 'FILE'} • Uploaded successfully
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadFile(fileMetadata.id, fileMetadata.name)}
                                    title="Download file"
                                    className="flex-shrink-0"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOptionalMedia(index)}
                                    disabled={deleteFileMutation.isPending}
                                    className="flex-shrink-0"
                                    title="Remove file"
                                  >
                                    {deleteFileMutation.isPending ? (
                                      <Spinner size={16} />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              {/* Show preview for images */}
                              {isImage && fileMetadata.id && (
                                <div className="mt-2">
                                  <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                                    <span className="ml-2 text-xs text-muted-foreground">Image preview available after download</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Files Being Uploaded List */}
                  {formData.optionalMedia.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="text-sm font-medium flex items-center space-x-2">
                        <span>Uploading Files ({formData.optionalMedia.length})</span>
                        {uploadMultipleFilesMutation.isPending && (
                          <Spinner size={16} />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formData.optionalMedia.map((file, index) => {
                          const FileIcon = getFileIcon(file)
                          const isImage = file.type.startsWith('image/')
                          const previewUrl = isImage ? URL.createObjectURL(file) : null

                          return (
                            <div
                              key={`${file.name}-${index}`}
                              className="border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1 min-w-0">
                                  <FileIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      optionalMedia: prev.optionalMedia.filter((_, i) => i !== index)
                                    }))
                                  }}
                                  disabled={uploadMultipleFilesMutation.isPending}
                                  className="flex-shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {previewUrl && (
                                <div className="mt-2">
                                  <img
                                    src={previewUrl}
                                    alt={file.name}
                                    className="w-full h-32 object-cover rounded-md border"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Tab Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <div></div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pb-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/main/admin/projects/drafts')}
            disabled={createProjectMutation.isPending || submitDraftMutation.isPending || saveDraftMutation.isPending || resubmitProjectMutation.isPending}
          >
            Cancel
          </Button>
          {!isRejectedProject && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={createProjectMutation.isPending || submitDraftMutation.isPending || saveDraftMutation.isPending || resubmitProjectMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveDraftMutation.isPending ? 'Saving...' : 'Save as Draft'}
            </Button>
          )}
          {allTabsComplete && (
            <Button
              type="submit"
              disabled={createProjectMutation.isPending || submitDraftMutation.isPending || saveDraftMutation.isPending || resubmitProjectMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isRejectedProject
                ? (resubmitProjectMutation.isPending ? 'Resubmitting...' : 'Resubmit Project')
                : (createProjectMutation.isPending || submitDraftMutation.isPending ? 'Submitting...' : 'Submit for Validation')}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}


