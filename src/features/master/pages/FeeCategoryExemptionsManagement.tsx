import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Edit, Tag, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type ColumnDef } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronDown } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiService from '@/services/api'
import { alerts } from '@/lib/alerts'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface ProjectCategory {
  id: number
  value: string
}

interface FeeCategoryExemption {
  id: number
  project_category: string
  is_listing_fee_exempt: boolean
  is_success_fee_exempt: boolean
  exemption_reason?: string
  is_active?: boolean
}

interface FeeCategoryExemptionForm {
  project_category: string
  is_listing_fee_exempt: boolean
  is_success_fee_exempt: boolean
  exemption_reason: string
  is_active?: boolean
}

export default function FeeCategoryExemptionsManagement() {
  const [exemptions, setExemptions] = useState<FeeCategoryExemption[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingExemption, setEditingExemption] = useState<FeeCategoryExemption | null>(null)
  const [formData, setFormData] = useState<FeeCategoryExemptionForm>({
    project_category: '',
    is_listing_fee_exempt: false,
    is_success_fee_exempt: false,
    exemption_reason: '',
    is_active: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [exemptionToDelete, setExemptionToDelete] = useState<FeeCategoryExemption | null>(null)
  const queryClient = useQueryClient()

  // Fetch project categories from master API
  const { data: categoriesResponse, isLoading: loadingCategories } = useQuery({
    queryKey: ['project-categories'],
    queryFn: () => apiService.get('/master/project-categories'),
  })

  // Extract categories from API response
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

  // Fetch exemptions on component mount
  useEffect(() => {
    fetchExemptions()
  }, [])

  const fetchExemptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.get('/fee-category-exemptions', {
        params: {
          skip: 0,
          limit: 100,
        }
      })
      // Handle different response structures
      if (Array.isArray(data)) {
        setExemptions(data)
      } else if (data?.data && Array.isArray(data.data)) {
        setExemptions(data.data)
      } else if (data?.results && Array.isArray(data.results)) {
        setExemptions(data.results)
      } else {
        setExemptions([])
      }
    } catch (err) {
      setError('Failed to fetch fee category exemptions. Please try again.')
      console.error('Error fetching exemptions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreateExemption = async () => {
    try {
      if (submitting) return
      setSubmitting(true)
      
      // Validation
      if (!formData.project_category.trim()) {
        alerts.error('Validation Error', 'Project category is required')
        setSubmitting(false)
        return
      }

      // Check if exemption already exists for this category
      const existingExemption = exemptions.find(
        (ex) => ex.project_category === formData.project_category
      )
      if (existingExemption) {
        alerts.error('Validation Error', 'Exemption already exists for this category')
        setSubmitting(false)
        return
      }

      await apiService.post('/fee-category-exemptions', {
        project_category: formData.project_category,
        is_listing_fee_exempt: formData.is_listing_fee_exempt,
        is_success_fee_exempt: formData.is_success_fee_exempt,
        exemption_reason: formData.exemption_reason || undefined,
      })
      alerts.success('Success', 'Fee category exemption created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      fetchExemptions()
      queryClient.invalidateQueries({ queryKey: ['fee-category-exemptions'] })
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create fee category exemption. Please try again.'
      alerts.error('Error', message)
      console.error('Error creating exemption:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditExemption = async () => {
    if (!editingExemption) return

    try {
      if (submitting) return
      setSubmitting(true)
      
      // Validation
      if (!formData.project_category.trim()) {
        alerts.error('Validation Error', 'Project category is required')
        setSubmitting(false)
        return
      }

      // Check if another exemption exists for this category (excluding current one)
      const existingExemption = exemptions.find(
        (ex) => ex.project_category === formData.project_category && ex.id !== editingExemption.id
      )
      if (existingExemption) {
        alerts.error('Validation Error', 'Exemption already exists for this category')
        setSubmitting(false)
        return
      }

      await apiService.put(`/fee-category-exemptions/${editingExemption.id}`, {
        is_listing_fee_exempt: formData.is_listing_fee_exempt,
        is_success_fee_exempt: formData.is_success_fee_exempt,
        exemption_reason: formData.exemption_reason || undefined,
        is_active: formData.is_active ?? true,
      })
      alerts.success('Success', 'Fee category exemption updated successfully')
      setIsEditDialogOpen(false)
      setEditingExemption(null)
      resetForm()
      fetchExemptions()
      queryClient.invalidateQueries({ queryKey: ['fee-category-exemptions'] })
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update fee category exemption. Please try again.'
      alerts.error('Error', message)
      console.error('Error updating exemption:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      project_category: '',
      is_listing_fee_exempt: false,
      is_success_fee_exempt: false,
      exemption_reason: '',
      is_active: true,
    })
    setCategoryOpen(false)
  }

  const openEditDialog = (exemption: FeeCategoryExemption) => {
    setEditingExemption(exemption)
    setFormData({
      project_category: exemption.project_category,
      is_listing_fee_exempt: exemption.is_listing_fee_exempt,
      is_success_fee_exempt: exemption.is_success_fee_exempt,
      exemption_reason: exemption.exemption_reason || '',
      is_active: exemption.is_active ?? true,
    })
    setIsEditDialogOpen(true)
  }

  const handleCategoryChange = (categoryValue: string) => {
    setFormData({ ...formData, project_category: categoryValue })
    setCategoryOpen(false)
  }

  const handleDeleteClick = (exemption: FeeCategoryExemption) => {
    setExemptionToDelete(exemption)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!exemptionToDelete) return

    try {
      setDeletingId(exemptionToDelete.id)
      await apiService.delete(`/fee-category-exemptions/${exemptionToDelete.id}`)
      alerts.success('Success', 'Fee category exemption deleted successfully')
      setDeleteConfirmOpen(false)
      setExemptionToDelete(null)
      fetchExemptions()
      queryClient.invalidateQueries({ queryKey: ['fee-category-exemptions'] })
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete fee category exemption. Please try again.'
      alerts.error('Error', message)
      console.error('Error deleting exemption:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnDef<FeeCategoryExemption, any>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'project_category',
      header: 'Project Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-medium">
          {row.original.project_category}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_listing_fee_exempt',
      header: 'Listing Fee Exempt',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.is_listing_fee_exempt ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Exempt
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              Not Exempt
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_success_fee_exempt',
      header: 'Success Fee Exempt',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.is_success_fee_exempt ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Exempt
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              Not Exempt
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active !== false ? 'default' : 'secondary'}>
          {row.original.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-start gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(row.original)}
            title="Edit Exemption"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteClick(row.original)}
            title="Delete Exemption"
            disabled={deletingId === row.original.id}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [deletingId])

  return (
    <div className="space-y-6">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create Fee Category Exemption</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Configure fee exemptions for a project category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project_category" className="text-sm font-medium">
                Project Category *
              </Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between h-10"
                    disabled={submitting || loadingCategories}
                  >
                    <div className="flex items-center text-gray-500 font-normal">
                      <Tag className="mr-3 h-4 w-4 text-gray-400" />
                      {loadingCategories ? (
                        <span className="flex items-center gap-2">
                          <Spinner size={16} /> Loading categories...
                        </span>
                      ) : formData.project_category ? (
                        categories.find((cat) => cat.value === formData.project_category)?.value || formData.project_category
                      ) : (
                        'Select project category'
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  {loadingCategories ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                      <Spinner size={16} /> Loading categories...
                    </div>
                  ) : (
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {categories
                            .filter((cat) => !exemptions.some((ex) => ex.project_category === cat.value))
                            .map((category) => (
                              <CommandItem
                                key={category.id}
                                value={category.value}
                                onSelect={() => handleCategoryChange(category.value)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.project_category === category.value ? 'opacity-100' : 'opacity-0'
                                  }`}
                                />
                                {category.value}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="listingFeeExempt" className="text-sm font-medium">
                    Listing Fee Exempt
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exempt this category from listing fees
                  </p>
                </div>
                <Switch
                  id="listingFeeExempt"
                  checked={formData.is_listing_fee_exempt}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_listing_fee_exempt: checked })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="successFeeExempt" className="text-sm font-medium">
                    Success Fee Exempt
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exempt this category from success fees
                  </p>
                </div>
                <Switch
                  id="successFeeExempt"
                  checked={formData.is_success_fee_exempt}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_success_fee_exempt: checked })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exemptionReason" className="text-sm font-medium">
                  Exemption Reason
                </Label>
                <Textarea
                  id="exemptionReason"
                  value={formData.exemption_reason}
                  onChange={(e) =>
                    setFormData({ ...formData, exemption_reason: e.target.value })
                  }
                  placeholder="Enter reason for exemption (e.g., Promotional category for Q1 2024)"
                  disabled={submitting}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Provide a reason for this exemption
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateExemption} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Exemption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading fee category exemptions...</div>
        </div>
      ) : exemptions.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No fee category exemptions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new fee category exemption.
          </p>
          <div className="mt-6">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Exemption
            </Button>
          </div>
        </div>
      ) : (
        <DataTable<FeeCategoryExemption, any>
          title="Fee Category Exemptions"
          description="Manage fee exemptions based on project categories"
          columns={columns}
          data={exemptions}
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Exemption
              </Button>
            </div>
          }
          showToolbar={true}
          showFooter={true}
          enableExport={true}
        />
      )}

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            resetForm()
            setEditingExemption(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Fee Category Exemption</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update fee exemption configuration for this project category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project Category</Label>
              <div className="h-10 px-3 py-2 text-sm bg-muted rounded-md border flex items-center">
                {formData.project_category || '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                Category cannot be changed after creation
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="editListingFeeExempt" className="text-sm font-medium">
                    Listing Fee Exempt
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exempt this category from listing fees
                  </p>
                </div>
                <Switch
                  id="editListingFeeExempt"
                  checked={formData.is_listing_fee_exempt}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_listing_fee_exempt: checked })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="editSuccessFeeExempt" className="text-sm font-medium">
                    Success Fee Exempt
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exempt this category from success fees
                  </p>
                </div>
                <Switch
                  id="editSuccessFeeExempt"
                  checked={formData.is_success_fee_exempt}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_success_fee_exempt: checked })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editExemptionReason" className="text-sm font-medium">
                  Exemption Reason
                </Label>
                <Textarea
                  id="editExemptionReason"
                  value={formData.exemption_reason}
                  onChange={(e) =>
                    setFormData({ ...formData, exemption_reason: e.target.value })
                  }
                  placeholder="Enter reason for exemption (e.g., Promotional category for Q1 2024)"
                  disabled={submitting}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Provide a reason for this exemption
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="editIsActive" className="text-sm font-medium">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable this exemption
                  </p>
                </div>
                <Switch
                  id="editIsActive"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditExemption} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Exemption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Confirm Delete</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete the fee exemption for <span className="font-semibold">{exemptionToDelete?.project_category}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setExemptionToDelete(null)
              }}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

