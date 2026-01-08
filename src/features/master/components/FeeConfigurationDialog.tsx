import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  Percent, 
  Calendar, 
  CheckCircle2, 
  FileText,
  History,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiService, { api } from '@/services/api'
import { alerts } from '@/lib/alerts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FeeConfiguration {
  feeConfigId?: number // ID of the fee configuration record (for updates)
  organizationId: number
  organizationType: 'lender' | 'municipality'
  
  // Subscription Fee (Lenders)
  subscriptionFee?: {
    enabled: boolean
    amount: number
    currency: string
    subscriptionPeriodMonths: number
    isExempt: boolean
    exemptionReason?: string
  }
  
  // Listing Fee (Municipalities)
  listingFee?: {
    enabled: boolean
    percentage: number
    isExempt: boolean
    exemptionReason?: string
  }
  
  // Success Fee (Municipalities)
  successFee?: {
    enabled: boolean
    percentage: number
    adjustAgainstListingFee: boolean
    isExempt: boolean
    exemptionReason?: string
  }
  
  // General
  isFullyExempt: boolean
  exemptionReason?: string
  configuredBy?: string
  configuredAt?: string
  updatedBy?: string
  updatedAt?: string
}

interface FeeConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: number
  organizationName: string
  organizationType: 'lender' | 'municipality'
  parentBranchId?: number
}

// Helper component for exemption reason input
const ExemptionReasonInput = ({
  id,
  value,
  onChange,
  label,
  placeholder = "Enter reason for exemption",
  description
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  description: string
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
)

export function FeeConfigurationDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  organizationType,
}: FeeConfigurationDialogProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('subscription')
  const [feeConfigId, setFeeConfigId] = useState<number | undefined>(undefined)
  
  // Subscription Fee State (for Lenders)
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false)
  const [subscriptionAmount, setSubscriptionAmount] = useState('')
  const [subscriptionCurrency, setSubscriptionCurrency] = useState('INR')
  const [subscriptionPeriodMonths, setSubscriptionPeriodMonths] = useState('12')
  const [subscriptionIsExempt, setSubscriptionIsExempt] = useState(false)
  const [subscriptionExemptionReason, setSubscriptionExemptionReason] = useState('')
  
  // Listing Fee State (for Municipalities)
  const [listingEnabled, setListingEnabled] = useState(false)
  const [listingPercentage, setListingPercentage] = useState('')
  const [listingIsExempt, setListingIsExempt] = useState(false)
  const [listingExemptionReason, setListingExemptionReason] = useState('')
  
  // Success Fee State (for Municipalities)
  const [successEnabled, setSuccessEnabled] = useState(false)
  const [successPercentage, setSuccessPercentage] = useState('')
  const [successAdjustAgainstListing, setSuccessAdjustAgainstListing] = useState(true)
  const [successIsExempt, setSuccessIsExempt] = useState(false)
  const [successExemptionReason, setSuccessExemptionReason] = useState('')


  // Reset form function
  const resetForm = useCallback(() => {
    setFeeConfigId(undefined)
    setSubscriptionEnabled(false)
    setSubscriptionAmount('')
    setSubscriptionCurrency('INR')
    setSubscriptionPeriodMonths('12')
    setSubscriptionIsExempt(false)
    setSubscriptionExemptionReason('')
    setListingEnabled(false)
    setListingPercentage('')
    setListingIsExempt(false)
    setListingExemptionReason('')
    setSuccessEnabled(false)
    setSuccessPercentage('')
    setSuccessAdjustAgainstListing(true)
    setSuccessIsExempt(false)
    setSuccessExemptionReason('')
  }, [])

  // Fetch existing fee configuration
  const { data: existingConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['feeConfiguration', organizationId],
    queryFn: async () => {
      try {
        const response = await api.get(`fee-configurations/organization/${organizationId}`, {
          headers: {
            'organization_id': organizationId.toString(),
            'Content-Type': 'application/json'
          }
        })
        
        // Log the response to debug
        console.log('Fee Configuration API Response (full):', response)
        console.log('Fee Configuration API Response (data):', response.data)
        console.log('Fee Configuration API Response - exemption fields:', {
          subscription_fee_exemption_reason: response.data?.subscription_fee_exemption_reason || response.data?.data?.subscription_fee_exemption_reason,
          listing_fee_exemption_reason: response.data?.listing_fee_exemption_reason || response.data?.data?.listing_fee_exemption_reason,
          success_fee_exemption_reason: response.data?.success_fee_exemption_reason || response.data?.data?.success_fee_exemption_reason,
          subscription_exempt: response.data?.subscription_exempt || response.data?.data?.subscription_exempt,
          is_listing_fee_exempt: response.data?.is_listing_fee_exempt || response.data?.data?.is_listing_fee_exempt,
          is_success_fee_exempt: response.data?.is_success_fee_exempt || response.data?.data?.is_success_fee_exempt,
        })
        
        // Handle different response structures
        const responseData = response.data?.data || response.data || response
        
        // Extract fee_config_id from various possible locations
        // Check multiple possible locations in the response
        const extractedFeeConfigId = responseData.fee_config_id 
          || responseData.feeConfigId 
          || responseData.id
          || responseData.fee_configuration_id
          || response.data?.id
          || response.data?.fee_config_id
          || (typeof responseData === 'object' && 'id' in responseData ? responseData.id : undefined)
        
        console.log('Extracted fee_config_id:', extractedFeeConfigId)
        console.log('Response data structure:', JSON.stringify(responseData, null, 2))
        
        // If still no ID found, log warning
        if (!extractedFeeConfigId) {
          console.warn('WARNING: Could not extract fee_config_id from response. Response structure:', responseData)
        }
        
        // Transform snake_case to camelCase if needed
        const transformedData: FeeConfiguration = {
          feeConfigId: extractedFeeConfigId,
          organizationId: responseData.organization_id || responseData.organizationId || organizationId,
          organizationType: (responseData.organization_type?.toLowerCase() || responseData.organizationType || organizationType) as 'lender' | 'municipality',
          isFullyExempt: responseData.is_fully_exempt || responseData.isFullyExempt || false,
          exemptionReason: responseData.exemption_reason || responseData.exemptionReason || '',
          configuredBy: responseData.configured_by || responseData.configuredBy,
          configuredAt: responseData.configured_at || responseData.configuredAt,
          updatedBy: responseData.updated_by || responseData.updatedBy,
          updatedAt: responseData.updated_at || responseData.updatedAt,
        }
        
        console.log('Transformed Fee Configuration with feeConfigId:', transformedData.feeConfigId)
        
        // Handle subscription fee (for lenders)
        // Check if subscription fee data exists OR if exemption-related fields exist
        if (responseData.subscription_fee_annual !== undefined || responseData.subscriptionFee || 
            responseData.subscription_exempt !== undefined || responseData.subscription_fee_exemption_reason) {
          const subFee = responseData.subscription_fee || responseData.subscriptionFee || {}
          const annualFee = responseData.subscription_fee_annual || subFee.amount || subFee.annual_amount || 0
          const isExempt = responseData.subscription_exempt !== undefined ? responseData.subscription_exempt : 
                          (subFee.is_exempt !== undefined ? subFee.is_exempt : false)
          transformedData.subscriptionFee = {
            enabled: subFee.enabled !== undefined ? subFee.enabled : (annualFee > 0 || isExempt),
            amount: typeof annualFee === 'string' ? parseFloat(annualFee) : annualFee,
            currency: subFee.currency || responseData.currency || 'INR',
            subscriptionPeriodMonths: subFee.subscription_period_months || subFee.subscriptionPeriodMonths || 12,
            isExempt: isExempt,
            exemptionReason: responseData.subscription_fee_exemption_reason || subFee.exemption_reason || subFee.exemptionReason || '',
          }
        }
        
        // Handle listing fee (for municipalities)
        // Check if listing fee data exists OR if exemption-related fields exist
        if (responseData.listing_fee_percentage !== undefined || responseData.listingFee || 
            responseData.is_listing_fee_exempt !== undefined || responseData.listing_fee_exemption_reason) {
          const listFee = responseData.listing_fee || responseData.listingFee || {}
          const percentage = responseData.listing_fee_percentage || listFee.percentage || 0
          const isExempt = responseData.is_listing_fee_exempt !== undefined ? responseData.is_listing_fee_exempt : 
                          (listFee.is_exempt !== undefined ? listFee.is_exempt : false)
          transformedData.listingFee = {
            enabled: listFee.enabled !== undefined ? listFee.enabled : (percentage > 0 || isExempt),
            percentage: typeof percentage === 'string' ? parseFloat(percentage) : percentage,
            isExempt: isExempt,
            exemptionReason: responseData.listing_fee_exemption_reason || listFee.exemption_reason || listFee.exemptionReason || '',
          }
        }
        
        // Handle success fee (for municipalities)
        // Check if success fee data exists OR if exemption-related fields exist
        if (responseData.success_fee_percentage !== undefined || responseData.successFee || 
            responseData.is_success_fee_exempt !== undefined || responseData.success_fee_exemption_reason) {
          const succFee = responseData.success_fee || responseData.successFee || {}
          const percentage = responseData.success_fee_percentage || succFee.percentage || 0
          const isExempt = responseData.is_success_fee_exempt !== undefined ? responseData.is_success_fee_exempt : 
                          (succFee.is_exempt !== undefined ? succFee.is_exempt : false)
          transformedData.successFee = {
            enabled: succFee.enabled !== undefined ? succFee.enabled : (percentage > 0 || isExempt),
            percentage: typeof percentage === 'string' ? parseFloat(percentage) : percentage,
            adjustAgainstListingFee: succFee.adjust_against_listing_fee !== undefined 
              ? succFee.adjust_against_listing_fee 
              : (succFee.adjustAgainstListingFee !== undefined ? succFee.adjustAgainstListingFee : true),
            isExempt: isExempt,
            exemptionReason: responseData.success_fee_exemption_reason || succFee.exemption_reason || succFee.exemptionReason || '',
          }
        }
        
        console.log('Transformed Fee Configuration:', transformedData)
        return transformedData
      } catch (error: any) {
        // If 404, return null (no config exists yet)
        if (error?.response?.status === 404) {
          console.log('No fee configuration found for organization:', organizationId)
          return null
        }
        console.error('Error fetching fee configuration:', error)
        throw error
      }
    },
    enabled: open && !!organizationId,
  })

  // Helper to decide whether we are updating an existing configuration or saving for the first time.
  // We treat it as "existing" only when the API has returned a configuration record with at least
  // one of the fee sections (subscription / listing / success) present.
  const hasExistingConfig =
    !!feeConfigId &&
    !!(
      existingConfig &&
      (existingConfig.subscriptionFee || existingConfig.listingFee || existingConfig.successFee)
    )

  // Populate form when config is loaded
  useEffect(() => {
    // Don't reset if still loading
    if (loadingConfig) {
      return
    }
    
    if (existingConfig) {
      console.log('Populating form with existing config:', existingConfig)
      console.log('feeConfigId from existingConfig:', existingConfig.feeConfigId)
      
      // Store fee_config_id for update operations
      if (existingConfig.feeConfigId) {
        setFeeConfigId(existingConfig.feeConfigId)
        console.log('Set feeConfigId state to:', existingConfig.feeConfigId)
      } else {
        console.warn('Warning: No feeConfigId found in existingConfig, will create new record')
        setFeeConfigId(undefined)
      }
      
      if (existingConfig.subscriptionFee) {
        console.log('Populating subscription fee:', existingConfig.subscriptionFee)
        setSubscriptionEnabled(existingConfig.subscriptionFee.enabled !== undefined ? existingConfig.subscriptionFee.enabled : true)
        setSubscriptionAmount(existingConfig.subscriptionFee.amount?.toString() || '')
        setSubscriptionCurrency(existingConfig.subscriptionFee.currency || 'INR')
        setSubscriptionPeriodMonths(existingConfig.subscriptionFee.subscriptionPeriodMonths?.toString() || '12')
        setSubscriptionIsExempt(existingConfig.subscriptionFee.isExempt || false)
        setSubscriptionExemptionReason(existingConfig.subscriptionFee.exemptionReason || '')
        console.log('Set subscription exemption reason:', existingConfig.subscriptionFee.exemptionReason)
      }
      
      if (existingConfig.listingFee) {
        console.log('Populating listing fee:', existingConfig.listingFee)
        setListingEnabled(existingConfig.listingFee.enabled !== undefined ? existingConfig.listingFee.enabled : true)
        setListingPercentage(existingConfig.listingFee.percentage?.toString() || '')
        setListingIsExempt(existingConfig.listingFee.isExempt || false)
        setListingExemptionReason(existingConfig.listingFee.exemptionReason || '')
        console.log('Set listing exemption reason:', existingConfig.listingFee.exemptionReason)
      }
      
      if (existingConfig.successFee) {
        console.log('Populating success fee:', existingConfig.successFee)
        setSuccessEnabled(existingConfig.successFee.enabled !== undefined ? existingConfig.successFee.enabled : true)
        setSuccessPercentage(existingConfig.successFee.percentage?.toString() || '')
        setSuccessAdjustAgainstListing(existingConfig.successFee.adjustAgainstListingFee ?? true)
        setSuccessIsExempt(existingConfig.successFee.isExempt || false)
        setSuccessExemptionReason(existingConfig.successFee.exemptionReason || '')
        console.log('Set success exemption reason:', existingConfig.successFee.exemptionReason)
      }
    } else if (!loadingConfig) {
      // Only reset to defaults when loading is complete and no config exists
      console.log('No existing config found, resetting form')
      setFeeConfigId(undefined) // Clear fee_config_id when no config exists
      resetForm()
    }
  }, [existingConfig, loadingConfig, resetForm])

  // Validation helpers
  const validateSubscriptionFee = useCallback(() => {
    if (!subscriptionEnabled) return true
    if (subscriptionIsExempt) {
      if (!subscriptionExemptionReason.trim()) {
        alerts.error('Validation Error', 'Please provide a reason for subscription fee exemption')
        return false
      }
    } else {
      if (!subscriptionAmount || parseFloat(subscriptionAmount) <= 0) {
        alerts.error('Validation Error', 'Please enter a valid subscription amount')
        return false
      }
      const periodMonths = parseFloat(subscriptionPeriodMonths)
      if (isNaN(periodMonths) || periodMonths <= 0) {
        alerts.error('Validation Error', 'Please enter a valid subscription period in months')
        return false
      }
    }
    return true
  }, [subscriptionEnabled, subscriptionIsExempt, subscriptionExemptionReason, subscriptionAmount, subscriptionPeriodMonths])

  const validateMunicipalityFees = useCallback(() => {
    if (listingEnabled) {
      if (listingIsExempt) {
        if (!listingExemptionReason.trim()) {
          alerts.error('Validation Error', 'Please provide a reason for listing fee exemption')
          return false
        }
      } else {
        const listingPct = parseFloat(listingPercentage)
        if (isNaN(listingPct) || listingPct < 0 || listingPct > 100) {
          alerts.error('Validation Error', 'Listing fee percentage must be between 0 and 100')
          return false
        }
      }
    }

    if (successEnabled) {
      if (successIsExempt) {
        if (!successExemptionReason.trim()) {
          alerts.error('Validation Error', 'Please provide a reason for success fee exemption')
          return false
        }
      } else {
        const successPct = parseFloat(successPercentage)
        if (isNaN(successPct) || successPct < 0 || successPct > 100) {
          alerts.error('Validation Error', 'Success fee percentage must be between 0 and 100')
          return false
        }
        if (successPct < 0.5 || successPct > 1) {
          alerts.error('Validation Error', 'Success fee should typically be between 0.5% and 1%')
          return false
        }
      }
    }
    return true
  }, [listingEnabled, listingIsExempt, listingExemptionReason, listingPercentage, successEnabled, successIsExempt, successExemptionReason, successPercentage])

  // Save mutation (handles both POST for create and PUT for update)
  const saveMutation = useMutation({
    mutationFn: async (data: {
      payload: {
        organization_type?: string
        organization_id?: string
        subscription_fee_annual?: string
        listing_fee_percentage?: number
        success_fee_percentage?: number
        // Exemption flags (used on create; backend maps to DB columns)
        subscription_exempt?: boolean
        is_listing_fee_exempt?: boolean
        is_success_fee_exempt?: boolean
        // Exemption reason fields (separate columns in DB)
        subscription_fee_exemption_reason?: string
        listing_fee_exemption_reason?: string
        success_fee_exemption_reason?: string
      }
      feeConfigId?: number
    }) => {
      const { payload, feeConfigId: configId } = data
      console.log('Save mutation called with feeConfigId:', configId)
      console.log('Payload:', payload)
      console.log('Is update?', !!configId)
      
      // Use PUT if fee_config_id exists (update), otherwise use POST (create)
      if (configId) {
        console.log(`Updating existing configuration with PUT /fee-configurations/${configId}`)
        console.log('PUT payload (should NOT include organization_type or organization_id):', payload)
        // Update existing configuration using PUT
        // For PUT: payload should only contain fee fields, NOT organization_type or organization_id
        const response = await api.put(`/fee-configurations/${configId}`, payload, {
          headers: {
            'fee_config_id': configId.toString(),
            'Content-Type': 'application/json'
          }
        })
        return response.data
      } else {
        console.log('Creating new configuration with POST /fee-configurations/')
        console.log('POST payload (should include organization_type and organization_id):', payload)
        // Create new configuration using POST
        // For POST: payload should include organization_type, organization_id, and fee fields
        return apiService.post('/fee-configurations/', payload)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feeConfiguration', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      alerts.success('Success', variables.feeConfigId ? 'Fee configuration updated successfully' : 'Fee configuration saved successfully')
      onOpenChange(false)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to save fee configuration'
      alerts.error('Error', errorMessage)
    },
  })

  // Handle Next button for municipalities (navigate to success fee tab)
  const handleNext = useCallback(() => {
    if (organizationType === 'municipality') {
      // Validate listing fee before moving to success fee
      if (listingEnabled) {
        if (listingIsExempt) {
          if (!listingExemptionReason.trim()) {
            alerts.error('Validation Error', 'Please provide a reason for listing fee exemption')
            return
          }
        } else {
          const listingPct = parseFloat(listingPercentage)
          if (isNaN(listingPct) || listingPct < 0 || listingPct > 100) {
            alerts.error('Validation Error', 'Listing fee percentage must be between 0 and 100')
            return
          }
        }
      }
      // Navigate to success fee tab
      setActiveTab('success')
    }
  }, [organizationType, listingEnabled, listingIsExempt, listingExemptionReason, listingPercentage])

  const handleSave = useCallback(() => {
    // Validation
    if (organizationType === 'lender' && !validateSubscriptionFee()) {
      return
    }

    if (organizationType === 'municipality' && !validateMunicipalityFees()) {
      return
    }

    // Determine if this is an update (PUT) or create (POST)
    const isUpdate = !!feeConfigId

    // Log current form state for debugging
    console.log('Current form state before building payload:', {
      organizationType,
      subscriptionEnabled,
      subscriptionIsExempt,
      subscriptionExemptionReason,
      listingEnabled,
      listingIsExempt,
      listingExemptionReason,
      successEnabled,
      successIsExempt,
      successExemptionReason
    })

    // Prepare payload according to API format
    // For PUT (update): Only send fee fields, NOT organization_type/organization_id/flags
    // For POST (create): Send organization_type, organization_id, fee fields + exemption flags/reason
    let payload: {
      organization_type?: string
      organization_id?: string
      subscription_fee_annual?: string
      listing_fee_percentage?: number
      success_fee_percentage?: number
      subscription_exempt?: boolean
      is_listing_fee_exempt?: boolean
      is_success_fee_exempt?: boolean
      subscription_fee_exemption_reason?: string
      listing_fee_exemption_reason?: string
      success_fee_exemption_reason?: string
    } = {}

    if (isUpdate) {
      // PUT request - Only send fee + exemption fields (no organization_type/organization_id)
      if (organizationType === 'lender') {
        // For lenders, send subscription_fee_annual as string
        // If exempt or disabled, send "0", otherwise send the amount
        if (subscriptionEnabled && !subscriptionIsExempt) {
          const annualAmount = parseFloat(subscriptionAmount) || 0
          // Convert monthly to annual if needed (assuming subscriptionPeriodMonths is monthly)
          const periodMonths = parseInt(subscriptionPeriodMonths) || 12
          const annualFee = periodMonths === 12 ? annualAmount : (annualAmount * 12) / periodMonths
          payload.subscription_fee_annual = annualFee.toString()
        } else {
          payload.subscription_fee_annual = '0'
        }
        // Subscription exemption flag and reason
        // Always send exemption flag if fee is enabled, or if exemption is explicitly set
        if (subscriptionEnabled || subscriptionIsExempt) {
          payload.subscription_exempt = subscriptionIsExempt
          if (subscriptionIsExempt && subscriptionExemptionReason.trim()) {
            payload.subscription_fee_exemption_reason = subscriptionExemptionReason.trim()
            console.log('Adding subscription exemption reason to payload:', subscriptionExemptionReason.trim())
          }
        }
      }

      if (organizationType === 'municipality') {
        // For municipalities, send listing_fee_percentage and success_fee_percentage
        // Use 0 if disabled or exempt, otherwise use the entered percentage
        payload.listing_fee_percentage = (listingEnabled && !listingIsExempt) 
          ? parseFloat(listingPercentage) || 0 
          : 0
        payload.success_fee_percentage = (successEnabled && !successIsExempt) 
          ? parseFloat(successPercentage) || 0 
          : 0

        // Municipality exemption flags and reasons
        // Always send exemption flags if fee is enabled, or if exemption is explicitly set
        if (listingEnabled || listingIsExempt) {
          payload.is_listing_fee_exempt = listingIsExempt
          if (listingIsExempt && listingExemptionReason.trim()) {
            payload.listing_fee_exemption_reason = listingExemptionReason.trim()
            console.log('Adding listing exemption reason to payload:', listingExemptionReason.trim())
          }
        }
        if (successEnabled || successIsExempt) {
          payload.is_success_fee_exempt = successIsExempt
          if (successIsExempt && successExemptionReason.trim()) {
            payload.success_fee_exemption_reason = successExemptionReason.trim()
            console.log('Adding success exemption reason to payload:', successExemptionReason.trim())
          }
        }
      }
    } else {
      // POST request - Send organization_type, organization_id, and fee fields
      payload.organization_type = organizationType === 'municipality' ? 'Municipality' : 'Lender'
      payload.organization_id = organizationId.toString()

      if (organizationType === 'lender') {
        // For lenders, send subscription_fee_annual as string
        // If exempt or disabled, send "0", otherwise send the amount
        if (subscriptionEnabled && !subscriptionIsExempt) {
          const annualAmount = parseFloat(subscriptionAmount) || 0
          // Convert monthly to annual if needed (assuming subscriptionPeriodMonths is monthly)
          const periodMonths = parseInt(subscriptionPeriodMonths) || 12
          const annualFee = periodMonths === 12 ? annualAmount : (annualAmount * 12) / periodMonths
          payload.subscription_fee_annual = annualFee.toString()
        } else {
          payload.subscription_fee_annual = '0'
        }
        // Subscription exemption flag and reason
        // Always send exemption flag if fee is enabled, or if exemption is explicitly set
        if (subscriptionEnabled || subscriptionIsExempt) {
          payload.subscription_exempt = subscriptionIsExempt
          if (subscriptionIsExempt && subscriptionExemptionReason.trim()) {
            payload.subscription_fee_exemption_reason = subscriptionExemptionReason.trim()
            console.log('Adding subscription exemption reason to payload:', subscriptionExemptionReason.trim())
          }
        }
      }

      if (organizationType === 'municipality') {
        // For municipalities, send BOTH listing_fee_percentage and success_fee_percentage together
        // Use 0 if disabled or exempt, otherwise use the entered percentage
        payload.listing_fee_percentage = (listingEnabled && !listingIsExempt) 
          ? parseFloat(listingPercentage) || 0 
          : 0
        payload.success_fee_percentage = (successEnabled && !successIsExempt) 
          ? parseFloat(successPercentage) || 0 
          : 0

        // Municipality exemption flags and reasons
        // Always send exemption flags if fee is enabled, or if exemption is explicitly set
        if (listingEnabled || listingIsExempt) {
          payload.is_listing_fee_exempt = listingIsExempt
          if (listingIsExempt && listingExemptionReason.trim()) {
            payload.listing_fee_exemption_reason = listingExemptionReason.trim()
            console.log('Adding listing exemption reason to payload:', listingExemptionReason.trim())
          }
        }
        if (successEnabled || successIsExempt) {
          payload.is_success_fee_exempt = successIsExempt
          if (successIsExempt && successExemptionReason.trim()) {
            payload.success_fee_exemption_reason = successExemptionReason.trim()
            console.log('Adding success exemption reason to payload:', successExemptionReason.trim())
          }
        }
      }
    }

    console.log('Prepared payload for', isUpdate ? 'PUT (update)' : 'POST (create)', ':', payload)
    console.log('Exemption reasons in payload:', {
      subscription_fee_exemption_reason: payload.subscription_fee_exemption_reason,
      listing_fee_exemption_reason: payload.listing_fee_exemption_reason,
      success_fee_exemption_reason: payload.success_fee_exemption_reason
    })

    saveMutation.mutate({
      payload,
      feeConfigId: feeConfigId
    })
  }, [
    organizationType,
    validateSubscriptionFee,
    validateMunicipalityFees,
    subscriptionEnabled,
    subscriptionIsExempt,
    subscriptionAmount,
    subscriptionPeriodMonths,
    subscriptionExemptionReason,
    listingEnabled,
    listingIsExempt,
    listingPercentage,
    listingExemptionReason,
    successEnabled,
    successIsExempt,
    successPercentage,
    successExemptionReason,
    organizationId,
    feeConfigId,
    saveMutation
  ])

  // Set default tab based on organization type
  useEffect(() => {
    if (open) {
      setActiveTab(organizationType === 'lender' ? 'subscription' : 'listing')
    } else {
      // Reset form when dialog closes
      resetForm()
    }
  }, [open, organizationType, resetForm])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Fee Configuration
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure fees for <span className="font-semibold">{organizationName}</span>
            <Badge variant="outline" className="ml-2 capitalize">{organizationType}</Badge>
          </DialogDescription>
        </DialogHeader>

        {loadingConfig ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading fee configuration...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {organizationType === 'lender' && (
                    <TabsTrigger value="subscription" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Subscription Fee
                    </TabsTrigger>
                  )}
                  {organizationType === 'municipality' && (
                    <>
                      <TabsTrigger value="listing" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Listing Fee
                      </TabsTrigger>
                      <TabsTrigger value="success" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Success Fee
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                {/* Subscription Fee Tab (Lenders) */}
                {organizationType === 'lender' && (
                  <TabsContent value="subscription" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Subscription Fee Configuration</CardTitle>
                        <CardDescription>
                          Annual or monthly subscription fee for platform access. May not be charged in Phase 1, but system supports configuration.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!subscriptionIsExempt && (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="subscriptionEnabled">Enable Subscription Fee</Label>
                              <p className="text-sm text-muted-foreground">
                                Enable subscription fee for this lender
                              </p>
                            </div>
                            <Switch
                              id="subscriptionEnabled"
                              checked={subscriptionEnabled}
                              onCheckedChange={setSubscriptionEnabled}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="subscriptionExempt">Exempt from Subscription Fee</Label>
                            <p className="text-sm text-muted-foreground">
                              Mark this lender as exempt from subscription fees
                            </p>
                          </div>
                          <Switch
                            id="subscriptionExempt"
                            checked={subscriptionIsExempt}
                            onCheckedChange={(checked) => {
                              setSubscriptionIsExempt(checked)
                              if (checked) {
                                // Automatically enable when exempt is enabled
                                setSubscriptionEnabled(true)
                              }
                              if (!checked) {
                                setSubscriptionExemptionReason('')
                              }
                            }}
                          />
                        </div>

                        {subscriptionIsExempt && (
                          <ExemptionReasonInput
                            id="subscriptionExemptionReason"
                            value={subscriptionExemptionReason}
                            onChange={setSubscriptionExemptionReason}
                            label="Exemption Reason *"
                            description="Please provide a reason for exempting this lender from subscription fees"
                          />
                        )}

                        {subscriptionEnabled && !subscriptionIsExempt && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="subscriptionAmount">Amount *</Label>
                                <Input
                                  id="subscriptionAmount"
                                  type="number"
                                  value={subscriptionAmount}
                                  onChange={(e) => setSubscriptionAmount(e.target.value)}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="subscriptionCurrency">Currency</Label>
                                <Select value={subscriptionCurrency} onValueChange={setSubscriptionCurrency}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="subscriptionPeriodMonths">Subscription Period (Months) *</Label>
                              <Input
                                id="subscriptionPeriodMonths"
                                type="number"
                                value={subscriptionPeriodMonths}
                                onChange={(e) => setSubscriptionPeriodMonths(e.target.value)}
                                placeholder="12"
                                min="1"
                                step="1"
                              />
                              <p className="text-xs text-muted-foreground">
                                Duration of the subscription period in months (default: 12 months)
                              </p>
                            </div>

                            {subscriptionAmount && parseFloat(subscriptionAmount) > 0 && subscriptionPeriodMonths && (
                              <Alert>
                                <DollarSign className="h-4 w-4" />
                                <AlertDescription>
                                  Subscription fee: <strong>{formatCurrency(parseFloat(subscriptionAmount))}</strong> for {subscriptionPeriodMonths} {parseInt(subscriptionPeriodMonths) === 1 ? 'month' : 'months'}
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Listing Fee Tab (Municipalities) */}
                {organizationType === 'municipality' && (
                  <TabsContent value="listing" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Listing Fee Configuration</CardTitle>
                        <CardDescription>
                          Fee charged when municipality posts a project. Calculated as percentage of project fund requirement. Can be set to 0% for promotional categories or exemptions.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!listingIsExempt && (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="listingEnabled">Enable Listing Fee</Label>
                              <p className="text-sm text-muted-foreground">
                                Enable listing fee for this municipality
                              </p>
                            </div>
                            <Switch
                              id="listingEnabled"
                              checked={listingEnabled}
                              onCheckedChange={setListingEnabled}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="listingExempt">Exempt from Listing Fee</Label>
                            <p className="text-sm text-muted-foreground">
                              Mark this municipality as exempt from listing fees
                            </p>
                          </div>
                          <Switch
                            id="listingExempt"
                            checked={listingIsExempt}
                            onCheckedChange={(checked) => {
                              setListingIsExempt(checked)
                              if (checked) {
                                // Automatically enable when exempt is enabled
                                setListingEnabled(true)
                              }
                              if (!checked) {
                                setListingExemptionReason('')
                              }
                            }}
                          />
                        </div>

                        {listingIsExempt && (
                          <ExemptionReasonInput
                            id="listingExemptionReason"
                            value={listingExemptionReason}
                            onChange={setListingExemptionReason}
                            label="Exemption Reason *"
                            description="Please provide a reason for exempting this municipality from listing fees"
                          />
                        )}

                        {listingEnabled && !listingIsExempt && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="listingPercentage">Listing Fee Percentage *</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="listingPercentage"
                                  type="number"
                                  value={listingPercentage}
                                  onChange={(e) => setListingPercentage(e.target.value)}
                                  placeholder="0.00"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="flex-1"
                                />
                                <span className="text-muted-foreground">%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Percentage of project fund requirement. Can be set to 0% for promotional categories.
                              </p>
                            </div>

                            {listingPercentage && parseFloat(listingPercentage) > 0 && (
                              <Alert>
                                <Percent className="h-4 w-4" />
                                <AlertDescription>
                                  Listing fee: <strong>{listingPercentage}%</strong> of project fund requirement
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Success Fee Tab (Municipalities) */}
                {organizationType === 'municipality' && (
                  <TabsContent value="success" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Success Fee Configuration</CardTitle>
                        <CardDescription>
                          Fee charged when project is successfully funded/closed. Typically 0.5-1% of funded amount. Can be adjusted against listing fee already paid.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!successIsExempt && (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="successEnabled">Enable Success Fee</Label>
                              <p className="text-sm text-muted-foreground">
                                Enable success fee for this municipality
                              </p>
                            </div>
                            <Switch
                              id="successEnabled"
                              checked={successEnabled}
                              onCheckedChange={setSuccessEnabled}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="successExempt">Exempt from Success Fee</Label>
                            <p className="text-sm text-muted-foreground">
                              Mark this municipality as exempt from success fees
                            </p>
                          </div>
                          <Switch
                            id="successExempt"
                            checked={successIsExempt}
                            onCheckedChange={(checked) => {
                              setSuccessIsExempt(checked)
                              if (checked) {
                                // Automatically enable when exempt is enabled
                                setSuccessEnabled(true)
                              }
                              if (!checked) {
                                setSuccessExemptionReason('')
                              }
                            }}
                          />
                        </div>

                        {successIsExempt && (
                          <ExemptionReasonInput
                            id="successExemptionReason"
                            value={successExemptionReason}
                            onChange={setSuccessExemptionReason}
                            label="Exemption Reason *"
                            description="Please provide a reason for exempting this municipality from success fees"
                          />
                        )}

                        {successEnabled && !successIsExempt && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="successPercentage">Success Fee Percentage *</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="successPercentage"
                                  type="number"
                                  value={successPercentage}
                                  onChange={(e) => setSuccessPercentage(e.target.value)}
                                  placeholder="0.50"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="flex-1"
                                />
                                <span className="text-muted-foreground">%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Typically between 0.5% and 1% of funded amount
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label htmlFor="successAdjust">Adjust Against Listing Fee</Label>
                                <p className="text-sm text-muted-foreground">
                                  Net amount = Success Fee - Listing Fee (if already paid)
                                </p>
                              </div>
                              <Switch
                                id="successAdjust"
                                checked={successAdjustAgainstListing}
                                onCheckedChange={setSuccessAdjustAgainstListing}
                              />
                            </div>

                            {successPercentage && parseFloat(successPercentage) > 0 && (
                              <Alert>
                                <Percent className="h-4 w-4" />
                                <AlertDescription>
                                  Success fee: <strong>{successPercentage}%</strong> of funded amount
                                  {successAdjustAgainstListing && (
                                    <span className="block mt-1 text-xs">
                                      Will be adjusted against listing fee if already paid
                                    </span>
                                  )}
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>

            {/* Configuration Info */}
            {existingConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Configuration History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {existingConfig.configuredBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Configured By:</span>
                      <span className="font-medium">{existingConfig.configuredBy}</span>
                    </div>
                  )}
                  {existingConfig.configuredAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Configured At:</span>
                      <span className="font-medium">
                        {new Date(existingConfig.configuredAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {existingConfig.updatedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated By:</span>
                      <span className="font-medium">{existingConfig.updatedBy}</span>
                    </div>
                  )}
                  {existingConfig.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated At:</span>
                      <span className="font-medium">
                        {new Date(existingConfig.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>
            Cancel
          </Button>

          {organizationType === 'municipality' && activeTab === 'listing' ? (
            // Municipality: first step – listing fee → Next
            <Button onClick={handleNext} disabled={saveMutation.isPending} className="flex items-center gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : organizationType === 'municipality' && activeTab === 'success' ? (
            // Municipality: second step – success fee → Back + Save
            <>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('listing')} 
                disabled={saveMutation.isPending}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : hasExistingConfig ? 'Update Configuration' : 'Save Configuration'}
              </Button>
            </>
          ) : (
            // Lenders or any other case: single-step Save
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : hasExistingConfig ? 'Update Configuration' : 'Save Configuration'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

