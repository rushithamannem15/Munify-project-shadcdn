import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { MessageCircle } from "lucide-react"
import { alerts } from "@/lib/alerts"
import { apiService } from "@/services/api"
import { useAuth } from "@/contexts/auth-context"

interface RequestMeetingDialogProps {
  open: boolean
  project_reference_id: string | null
  onClose: () => void
}

export function RequestMeetingDialog({
  open,
  project_reference_id,
  onClose,
}: RequestMeetingDialogProps) {
  const [description, setDescription] = useState("")
  const [descriptionError, setDescriptionError] = useState("")

  const { user } = useAuth()
  const currentUserId = user?.data?.login

  const resetForm = () => {
    setDescription("")
    setDescriptionError("")
  }

  const validateDescription = (value: string) => {
    if (!value.trim()) {
      setDescriptionError("Description is required")
      return false
    }
    if (value.trim().length < 10) {
      setDescriptionError("Description must be at least 10 characters")
      return false
    }
    setDescriptionError("")
    return true
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setDescription(value)
    if (descriptionError) {
      validateDescription(value)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const requestMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!project_reference_id) {
        throw new Error("Project reference ID is required")
      }

      if (!description.trim()) {
        throw new Error("Description is required")
      }

      if (description.trim().length < 10) {
        throw new Error("Description must be at least 10 characters")
      }

      const payload = {
        project_reference_id: project_reference_id,
        requested_by: currentUserId,
        description: description.trim(),
        requested_at: new Date().toISOString(),
      }

      return await apiService.post("/meeting-requests", payload)
    },
    onSuccess: () => {
      alerts.success("Meeting Request Submitted", "Your meeting request has been submitted successfully.")
      resetForm()
      onClose()
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to submit meeting request. Please try again."
      // Close the main dialog first, then show error alert
      handleClose()
      // Use setTimeout to ensure dialog closes before showing error alert
      setTimeout(() => {
        alerts.error("Error", message)
      }, 100)
    },
  })

  const handleSubmit = () => {
    if (validateDescription(description)) {
      requestMeetingMutation.mutate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Schedule Meeting</DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Submit a request to schedule a meeting with the municipality regarding this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Reason for Meeting *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Please describe why you would like to schedule a meeting..."
              rows={6}
              className={`resize-none text-sm ${descriptionError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {descriptionError && (
              <p className="text-xs text-destructive mt-1">{descriptionError}</p>
            )}
            {!descriptionError && (
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters required
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={requestMeetingMutation.isPending}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={requestMeetingMutation.isPending || !!descriptionError || !description.trim()}
          >
            {requestMeetingMutation.isPending ? (
              <>
                <Spinner className="mr-2" size={16} />
                Submitting...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Submit Meeting Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

